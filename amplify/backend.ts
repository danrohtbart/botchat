import { defineBackend } from '@aws-amplify/backend';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import type { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
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

// The lambda is typed as IFunction but at runtime is a Function. Cast so
// we can call addEnvironment (only exists on the concrete class).
const triggerFn = backend.botchatTrigger.resources.lambda as LambdaFunction;
// data.resources.graphqlApi is typed as IGraphqlApi which exposes apiId but
// NOT graphqlUrl. The Gen 2 data construct doesn't back this with the CDK
// appsync.GraphqlApi class either, so casting and reading .graphqlUrl
// returns undefined at runtime — addEnvironment then silently drops the
// var. Construct the URL from apiId + region instead.
const graphqlApi = backend.data.resources.graphqlApi;
const graphqlUrl = `https://${graphqlApi.apiId}.appsync-api.${triggerFn.stack.region}.amazonaws.com/graphql`;

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

// Inject AppSync endpoint and region as env vars. handler.js was written
// for Gen 1, where Amplify auto-injected these as
// API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT and REGION via "Amplify Params"
// magic env vars. Gen 2 doesn't auto-inject — we have to wire them up.
triggerFn.addEnvironment(
  'API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT',
  graphqlUrl,
);
triggerFn.addEnvironment(
  'REGION',
  triggerFn.stack.region,
);

// TODO (PR 4 — cutover): attach the botchat-trigger Lambda as an event-source
// for the Personalities and Chat DDB streams. We do NOT attach in PR 1 because:
//   1. The Gen 1 Lambda is already attached to those streams in dev/main.
//      Each stream supports a maximum of 2 consumers. Adding ours during the
//      sandbox phase would double-fire on every record (duplicate avatars,
//      duplicate bot replies).
//   2. The event-source mapping needs to be torn down on the Gen 1 side at
//      the same instant we attach on the Gen 2 side. That's a cutover script,
//      not a per-deploy config.
//
// Cutover sketch:
//   const personalitiesTable = aws_dynamodb.Table.fromTableAttributes(
//     backend.createStack('GenOneDataSources'),
//     'Personalities',
//     {
//       tableArn: 'arn:aws:dynamodb:us-east-1:253178317163:table/Personalities-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
//       tableStreamArn: '...',
//     },
//   );
//   triggerFn.addEventSource(new DynamoEventSource(personalitiesTable, {
//     startingPosition: StartingPosition.LATEST,
//     batchSize: 1,
//   }));

export default backend;
