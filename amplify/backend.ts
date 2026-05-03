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

const branch = process.env.AWS_BRANCH === 'main' ? 'main' : 'dev';
const cfg = ENV_CONFIG[branch];

triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:PutObject'],
    resources: [`arn:aws:s3:::${cfg.avatarBucket}/*`],
  }),
);

// During the migration, the Lambda writes via the EXISTING Gen 1 AppSync
// API (not the Gen 2 one). Two reasons:
//   1. The Gen 1 frontend still subscribes to Gen 1's onCreateChat /
//      onUpdatePersonalities. AppSync subscriptions only fire for mutations
//      sent through THE SAME API — even when both APIs share DDB tables.
//      A mutation through Gen 2 AppSync writes the record but Gen 1's
//      subscription stays silent, so users see no bot reply / no new avatar
//      until they hard-refresh.
//   2. Gen 2's auto-generated update resolvers apply a stricter conditional
//      check than Gen 1's, which fails on legacy records (returns
//      DynamoDB:ConditionalCheckFailedException). Fixing this properly is
//      separate from the cutover.
// Once the frontend itself moves to Gen 2 AppSync (later PR), we can switch
// the Lambda back to the Gen 2 endpoint.
//
// IMPORTANT: Gen 1's resolvers have a hardcoded adminRoles list in their
// VTL stash. The Gen 2 trigger Lambda's name has been added to that list
// out-of-band via `scripts/patch-gen1-resolvers.py`. Any `amplify push
// --env <env>` on the Gen 1 stack will overwrite that patch — re-run the
// script after each push.
triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    // The Gen 1 Lambda's IAM policy uses per-type ARNs (Query/*, Mutation/*,
    // Subscription/*) — using just /* somehow doesn't satisfy the AppSync
    // authorizer. Match the Gen 1 pattern exactly.
    resources: [
      `${cfg.gen1ApiArn}/types/Query/*`,
      `${cfg.gen1ApiArn}/types/Mutation/*`,
      `${cfg.gen1ApiArn}/types/Subscription/*`,
      `${graphqlApi.arn}/*`,
    ],
  }),
);

const addEnv = (k: string, v: string) =>
  (triggerFn as unknown as { addEnvironment(k: string, v: string): unknown })
    .addEnvironment(k, v);
addEnv('API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT', cfg.gen1ApiUrl);
addEnv('REGION', triggerFn.stack.region);

// Subscribe the Gen 2 trigger Lambda to the existing Gen 1 DDB streams. The
// Gen 1 trigger Lambda is also attached; we disable its mapping at cutover
// time via `aws lambda update-event-source-mapping --no-enabled`. DDB
// streams support max 2 consumers — keep that in mind for any future swap.
//
// Batch sizes match the existing Gen 1 mappings: Personalities=10, Chat=100.
// (handler.js only processes Records[0] anyway — a known Gen 1 bug to fix
// in a separate ticket — so larger batches just discard the rest.)
const dataSourcesStack = backend.createStack('GenOneDataSources');

const personalitiesTable = aws_dynamodb.Table.fromTableAttributes(
  dataSourcesStack,
  'PersonalitiesGen1Table',
  {
    tableArn: cfg.personalitiesTableArn,
    tableStreamArn: cfg.personalitiesStreamArn,
  },
);

const chatTable = aws_dynamodb.Table.fromTableAttributes(
  dataSourcesStack,
  'ChatGen1Table',
  {
    tableArn: cfg.chatTableArn,
    tableStreamArn: cfg.chatStreamArn,
  },
);

triggerFn.addEventSource(
  new DynamoEventSource(personalitiesTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
  }),
);

triggerFn.addEventSource(
  new DynamoEventSource(chatTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 100,
  }),
);

export default backend;
