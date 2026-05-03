import { defineFunction } from '@aws-amplify/backend';

/**
 * DDB stream trigger Lambda. Subscribes to the Personalities and Chat tables
 * and orchestrates avatar generation (Llama3 + DALL-E + S3) and bot replies
 * (Bedrock Converse). The DDB event-source mapping is wired up in backend.ts
 * via a CDK escape hatch — currently deferred to PR 4 cutover (see TODO in
 * backend.ts) because the Gen 1 Lambda is still attached to the same streams.
 *
 * Env vars consumed by handler.js:
 *   OPENAI_API_KEY_SSM_PATH  — SSM Parameter Store path to the OpenAI key
 *   AVATAR_S3_BUCKET         — destination bucket for generated avatars
 *
 * IAM grants (added in backend.ts):
 *   ssm:GetParameter on the OpenAI key parameter
 *   kms:Decrypt on alias/aws/ssm
 *   s3:PutObject on the avatar bucket
 *   bedrock:InvokeModel (AmazonBedrockFullAccess)
 *   appsync:GraphQL on the data API
 *
 * IMPORTANT: do NOT add a package.json to this directory. NodeJS would treat
 * it as the closest manifest and override amplify/package.json's
 * "type": "module" setting, causing this resource.ts to parse as CJS and
 * its exports to be invisible to ESM imports in backend.ts.
 */
export const botchatTrigger = defineFunction({
  name: 'botchat-trigger',
  // .cjs because amplify/package.json has "type": "module" — the bundler
  // would otherwise emit index.mjs and the runtime would refuse the
  // CJS-style require()/exports.handler in this file.
  entry: './handler.cjs',
  runtime: 20,
  timeoutSeconds: 90,
  memoryMB: 512,
  environment: {
    OPENAI_API_KEY_SSM_PATH: '/botchat/openai-api-key',
    AVATAR_S3_BUCKET: process.env.AWS_BRANCH === 'main'
      ? 'botchat-avatars-main-253178317163'
      : 'botchat-avatars-dev-253178317163',
  },
});
