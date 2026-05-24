import { defineFunction } from '@aws-amplify/backend';

export const botchatPresignup = defineFunction({
  name: 'botchat-presignup',
  entry: './handler.js',
  runtime: 24,
  timeoutSeconds: 30,
});
