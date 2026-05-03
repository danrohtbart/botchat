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

const branch = process.env.AWS_BRANCH ?? 'dev';
const avatarBucket = branch === 'main'
  ? 'botchat-avatars-main-253178317163'
  : 'botchat-avatars-dev-253178317163';

triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:PutObject'],
    resources: [`arn:aws:s3:::${avatarBucket}/*`],
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
const GEN1_DEV_GRAPHQL_API_ARN =
  'arn:aws:appsync:us-east-1:253178317163:apis/3orw633ymrbvrbyolakl6hjc5a';
const GEN1_DEV_GRAPHQL_URL =
  'https://3orw633ymrbvrbyolakl6hjc5a.appsync-api.us-east-1.amazonaws.com/graphql';

triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`${GEN1_DEV_GRAPHQL_API_ARN}/*`, `${graphqlApi.arn}/*`],
  }),
);

(triggerFn as unknown as { addEnvironment(k: string, v: string): unknown }).addEnvironment(
  'API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT',
  GEN1_DEV_GRAPHQL_URL,
);
(triggerFn as unknown as { addEnvironment(k: string, v: string): unknown }).addEnvironment(
  'REGION',
  triggerFn.stack.region,
);

// PR 4 cutover: subscribe the Gen 2 trigger Lambda to the dev DDB streams
// for Personalities and Chat. The Gen 1 trigger is currently attached too;
// that mapping is disabled separately via `aws lambda update-event-source-mapping`
// at deploy time so we don't double-fire (one bot reply per chat, one avatar
// per personality update). DDB streams support max 2 consumers — keep that
// in mind for any future swap.
//
// Batch sizes match the existing Gen 1 mappings: Personalities=10, Chat=100.
// (handler.js only processes Records[0] anyway — a known Gen 1 bug to fix
// in a separate ticket — so larger batches just discard the rest.)
const dataSourcesStack = backend.createStack('GenOneDataSources');

const personalitiesTable = aws_dynamodb.Table.fromTableAttributes(
  dataSourcesStack,
  'PersonalitiesDevTable',
  {
    tableArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Personalities-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
    tableStreamArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Personalities-bgc6zyl7obfwla3r5qiwnrhk7a-dev/stream/2026-04-13T18:47:53.637',
  },
);

const chatTable = aws_dynamodb.Table.fromTableAttributes(
  dataSourcesStack,
  'ChatDevTable',
  {
    tableArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Chat-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
    tableStreamArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Chat-bgc6zyl7obfwla3r5qiwnrhk7a-dev/stream/2026-04-13T18:48:41.542',
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
