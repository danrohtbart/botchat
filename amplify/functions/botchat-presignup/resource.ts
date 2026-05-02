import { defineFunction } from '@aws-amplify/backend';

export const botchatPresignup = defineFunction({
  name: 'botchat-presignup',
  entry: './handler.js',
  runtime: 20,
  timeoutSeconds: 30,
});
