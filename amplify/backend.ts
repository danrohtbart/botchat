import { defineBackend } from '@aws-amplify/backend';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { botchatPresignup } from './functions/botchat-presignup/resource';
import { botchatTrigger } from './functions/botchat-trigger/resource';

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
    resources: [`${backend.data.resources.graphqlApi.arn}/*`],
  }),
);

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
