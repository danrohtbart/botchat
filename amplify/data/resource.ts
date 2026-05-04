import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { botchatTrigger } from '../functions/botchat-trigger/resource.js';

const schema = a.schema({
  Personalities: a
    .model({
      name_1: a.string(),
      personality_1: a.string(),
      name_2: a.string(),
      personality_2: a.string(),
      image_1: a.string(),
      image_2: a.string(),
      user_email: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated('identityPool').to(['read', 'update']),
    ]),

  Chat: a
    .model({
      message: a.string().required(),
      message_in_thread: a.integer(),
      user_email: a.string(),
      speaker_name: a.string(),
      thread_id: a.id(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated(),
      allow.authenticated('identityPool').to(['create', 'read']),
    ]),

  Bot: a
    .model({
      bot_order: a.integer().required(),
      bot_name: a.string(),
      bot_personality: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated('identityPool'),
    ]),
})
  // Schema-level grant: the trigger Lambda needs query+mutate access to all
  // models. Schema-level allow.resource is the only place .resource() exists
  // (model-level authorization callbacks omit it). Gen 2 wires the Lambda's
  // role into AppSync's IAM auth automatically — no separate addToRolePolicy
  // call needed for appsync:GraphQL (we leave the explicit one in backend.ts
  // as belt-and-suspenders).
  .authorization((allow) => [allow.resource(botchatTrigger).to(['query', 'mutate'])]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
  // branchName here MUST match the literal AWS_BRANCH at deploy time.
  // We deploy from the long-lived feature branches claude/gen2-deployment
  // and claude/gen2-main, NOT plain "dev"/"main" — so those names are what
  // we key on. Without this match, the prior deploy created brand-new
  // empty tables (Personalities-...-NONE etc.) and the live frontend
  // started writing to them, stranding all the legacy data.
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      branchName: 'claude/gen2-deployment',
      modelNameToTableNameMapping: {
        Personalities: 'Personalities-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
        Chat: 'Chat-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
        Bot: 'Bot-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
      },
    },
    {
      branchName: 'claude/gen2-main',
      modelNameToTableNameMapping: {
        Personalities: 'Personalities-ibuxugjs25bqrc2imosybxgkhe-main',
        Chat: 'Chat-ibuxugjs25bqrc2imosybxgkhe-main',
        Bot: 'Bot-ibuxugjs25bqrc2imosybxgkhe-main',
      },
    },
  ],
});
