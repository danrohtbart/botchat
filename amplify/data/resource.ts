import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

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
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      branchName: 'dev',
      modelNameToTableNameMapping: {
        Personalities: 'Personalities-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
        Chat: 'Chat-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
        Bot: 'Bot-bgc6zyl7obfwla3r5qiwnrhk7a-dev',
      },
    },
    {
      branchName: 'main',
      modelNameToTableNameMapping: {
        Personalities: 'Personalities-ibuxugjs25bqrc2imosybxgkhe-main',
        Chat: 'Chat-ibuxugjs25bqrc2imosybxgkhe-main',
        Bot: 'Bot-ibuxugjs25bqrc2imosybxgkhe-main',
      },
    },
  ],
});
