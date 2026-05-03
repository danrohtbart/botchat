import { defineFunction } from '@aws-amplify/backend';

// Minimal definition for spike — full IAM grants and DDB stream wiring
// are added in backend.ts. Keeps parity with botchat-presignup until we
// can isolate why the prior props caused a synth-time export error.
export const botchatTrigger = defineFunction({
  name: 'botchat-trigger',
  entry: './handler.js',
});

