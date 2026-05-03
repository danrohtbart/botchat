import { defineFunction } from '@aws-amplify/backend';

export const botchatPresignup = defineFunction({
  name: 'botchat-presignup',
  // .cjs because amplify/package.json has "type": "module" — the bundler
  // would otherwise emit index.mjs and the runtime would refuse the
  // CJS-style exports.handler in this file.
  entry: './handler.cjs',
  runtime: 20,
  timeoutSeconds: 30,
});
