import { defineBackend } from '@aws-amplify/backend';
import { aws_dynamodb } from 'aws-cdk-lib';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
// .js extensions are required because amplify/package.json sets "type": "module".
// TypeScript's bundler moduleResolution accepts the .js suffix on .ts source files.
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { botchatPresignup } from './functions/botchat-presignup/resource.js';
import { botchatTrigger } from './functions/botchat-trigger/resource.js';

const backend = defineBackend({
  auth,
  data,
  botchatPresignup,
  botchatTrigger,
});

const triggerFn = backend.botchatTrigger.resources.lambda;
const graphqlApi = backend.data.resources.graphqlApi;

triggerFn.role!.addManagedPolicy(
  ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
);

triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['ssm:GetParameter'],
    resources: [
      `arn:aws:ssm:us-east-1:253178317163:parameter/botchat/openai-api-key`,
    ],
  }),
);

triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['kms:Decrypt'],
    resources: ['arn:aws:kms:us-east-1:253178317163:alias/aws/ssm'],
  }),
);

// All Gen 1 references — keyed by Amplify branch name. The hosting app
// builds claude/gen2-deployment for dev validation today; "main" gets its
// own branch when we're ready for PR 5 cutover. Anything that isn't "main"
// (including the long feature branch) is treated as dev.
//
// AppSync IDs vs URL hostnames are separate identifiers — the API ID goes
// in IAM ARNs and DDB table-name prefixes; the URL hostname is what you
// HTTP request. Verified via `aws appsync get-graphql-api --api-id <id>`.
const ENV_CONFIG = {
  dev: {
    avatarBucket: 'botchat-avatars-dev-253178317163',
    gen1ApiArn: 'arn:aws:appsync:us-east-1:253178317163:apis/bgc6zyl7obfwla3r5qiwnrhk7a',
    gen1ApiUrl: 'https://3orw633ymrbvrbyolakl6hjc5a.appsync-api.us-east-1.amazonaws.com/graphql',
    personalitiesTableArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Personalities-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
    personalitiesStreamArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Personalities-bgc6zyl7obfwla3r5qiwnrhk7a-dev/stream/2026-04-13T18:47:53.637',
    chatTableArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Chat-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
    chatStreamArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Chat-bgc6zyl7obfwla3r5qiwnrhk7a-dev/stream/2026-04-13T18:48:41.542',
  },
  main: {
    avatarBucket: 'botchat-avatars-main-253178317163',
    gen1ApiArn: 'arn:aws:appsync:us-east-1:253178317163:apis/ibuxugjs25bqrc2imosybxgkhe',
    gen1ApiUrl: 'https://owa7onc5w5fe7nojj5zjbaf3ru.appsync-api.us-east-1.amazonaws.com/graphql',
    personalitiesTableArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Personalities-ibuxugjs25bqrc2imosybxgkhe-main',
    personalitiesStreamArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Personalities-ibuxugjs25bqrc2imosybxgkhe-main/stream/2024-01-02T03:32:42.695',
    chatTableArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Chat-ibuxugjs25bqrc2imosybxgkhe-main',
    chatStreamArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Chat-ibuxugjs25bqrc2imosybxgkhe-main/stream/2023-12-22T22:37:07.812',
  },
} as const;

// Map the literal Amplify branch name to a logical env. The gen2 hosting
// app builds claude/gen2-deployment for dev validation and claude/gen2-main
// for main validation. After full cutover the branches will be plain
// dev/main but during the migration we use long-lived feature branches so
// the existing Gen 1 hosting app's dev/main keep building from origin/dev
// and origin/main untouched.
const branchEnv = process.env.AWS_BRANCH ?? '';
const branch: 'dev' | 'main' =
  branchEnv === 'main' || branchEnv === 'claude/gen2-main' ? 'main' : 'dev';
const cfg = ENV_CONFIG[branch];

triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:PutObject'],
    resources: [`arn:aws:s3:::${cfg.avatarBucket}/*`],
  }),
);

// Frontend cutover is complete (botchatapp.com now served by botchat-gen2,
// using Gen 2 AppSync). Trigger Lambda now writes back through Gen 2
// AppSync so the frontend's Gen 2 subscriptions see the bot replies and
// avatar updates. The Gen 1 grant stays for now — harmless extra perm,
// and will be removed when the rest of Gen 1 is decommissioned.
triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [
      `${graphqlApi.arn}/*`,
      `${cfg.gen1ApiArn}/types/Query/*`,
      `${cfg.gen1ApiArn}/types/Mutation/*`,
      `${cfg.gen1ApiArn}/types/Subscription/*`,
    ],
  }),
);

// AMPLIFY_DATA_GRAPHQL_ENDPOINT is auto-injected by Gen 2 (via SSM
// reference) thanks to the schema-level allow.resource() rule. The handler
// now reads that. The legacy API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT env var
// is kept (pointing at Gen 1) so we can flip back instantly during the
// soak window if Gen 2 mutations regress.
const addEnv = (k: string, v: string) =>
  (triggerFn as unknown as { addEnvironment(k: string, v: string): unknown })
    .addEnvironment(k, v);
addEnv('API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT', cfg.gen1ApiUrl);
addEnv('REGION', triggerFn.stack.region);
addEnv('AVATAR_S3_BUCKET', cfg.avatarBucket);

// Subscribe the Gen 2 trigger Lambda to the existing Gen 1 DDB streams. The
// Gen 1 trigger Lambda is also attached; we disable its mapping at cutover
// time via `aws lambda update-event-source-mapping --no-enabled`. DDB
// streams support max 2 consumers — keep that in mind for any future swap.
//
// Batch sizes match the existing Gen 1 mappings: Personalities=10, Chat=100.
// (handler.js only processes Records[0] anyway — a known Gen 1 bug to fix
// in a separate ticket — so larger batches just discard the rest.)
const dataSourcesStack = backend.createStack('GenOneDataSources');

// Construct IDs are per-branch — renaming them in an existing stack would
// trigger CFN delete+create and fail because the underlying event-source
// mapping is still in use. Keep dev's existing 'PersonalitiesDevTable' /
// 'ChatDevTable' IDs stable; use new IDs for main's first deploy.
const personalitiesConstructId = branch === 'main' ? 'PersonalitiesMainTable' : 'PersonalitiesDevTable';
const chatConstructId = branch === 'main' ? 'ChatMainTable' : 'ChatDevTable';

const personalitiesTable = aws_dynamodb.Table.fromTableAttributes(
  dataSourcesStack,
  personalitiesConstructId,
  {
    tableArn: cfg.personalitiesTableArn,
    tableStreamArn: cfg.personalitiesStreamArn,
  },
);

const chatTable = aws_dynamodb.Table.fromTableAttributes(
  dataSourcesStack,
  chatConstructId,
  {
    tableArn: cfg.chatTableArn,
    tableStreamArn: cfg.chatStreamArn,
  },
);

// Both dev and main cutovers are committed in code (Gen 2 mappings owned).
// Disabling the Gen 1 mappings (out-of-band, per-function) is the only
// out-of-band step. Re-running this build redeploys the Gen 2 mappings
// as Enabled, preserving cutover state.
const mappingsEnabled = true;

triggerFn.addEventSource(
  new DynamoEventSource(personalitiesTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    enabled: mappingsEnabled,
  }),
);

triggerFn.addEventSource(
  new DynamoEventSource(chatTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 100,
    enabled: mappingsEnabled,
  }),
);

export default backend;
