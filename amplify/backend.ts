import { defineBackend } from '@aws-amplify/backend';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
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

const branchEnv = process.env.AWS_BRANCH ?? '';
const avatarBucket = branchEnv === 'main' || branchEnv === 'claude/gen2-main'
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
    resources: [`${backend.data.resources.graphqlApi.arn}/*`],
  }),
);

const addEnv = (k: string, v: string) =>
  (triggerFn as unknown as { addEnvironment(k: string, v: string): unknown })
    .addEnvironment(k, v);
addEnv('REGION', triggerFn.stack.region);
addEnv('AVATAR_S3_BUCKET', avatarBucket);


const personalitiesTable = backend.data.resources.tables['Personalities'];
const chatTable = backend.data.resources.tables['Chat'];


triggerFn.addEventSource(new DynamoEventSource(personalitiesTable, {
  startingPosition: StartingPosition.LATEST,
  batchSize: 1,
}));
triggerFn.addEventSource(new DynamoEventSource(chatTable, {
  startingPosition: StartingPosition.LATEST,
  batchSize: 1,
}));

export default backend;
