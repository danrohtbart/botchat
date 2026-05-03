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

triggerFn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`${graphqlApi.arn}/*`],
  }),
);

// AppSync endpoint and region are auto-injected by Gen 2 (via SSM
// reference) thanks to the schema-level allow.resource() rule in
// amplify/data/resource.ts. The handler reads AMPLIFY_DATA_GRAPHQL_ENDPOINT
// and AWS_REGION (both auto-set), so we don't need to call addEnvironment
// for the GraphQL URL anymore.

// PR 4 cutover: subscribe the Gen 2 trigger Lambda to the dev DDB streams
// for Personalities and Chat. The Gen 1 trigger is currently attached too;
// that mapping is disabled separately via `aws lambda update-event-source-mapping`
// at deploy time so we don't double-fire (one bot reply per chat, one avatar
// per personality update). DDB streams support max 2 consumers — keep that
// in mind for any future swap.
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
    batchSize: 1,
  }),
);

triggerFn.addEventSource(
  new DynamoEventSource(chatTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 1,
  }),
);

export default backend;
