import { defineFunction } from '@aws-amplify/backend';

/**
 * DDB stream trigger Lambda. Subscribes to the Personalities and Chat tables
 * and orchestrates avatar generation (Llama3 + DALL-E + S3) and bot replies
 * (Bedrock Converse). The DDB event-source mapping is wired up in backend.ts
 * via a CDK escape hatch because referenceAuth/migrated tables are not part of
 * the Gen 2 stack lifecycle and we need to attach to the existing streams.
 *
 * Env vars consumed by handler.js:
 *   OPENAI_API_KEY_SSM_PATH  — SSM Parameter Store path to the OpenAI key
 *   AVATAR_S3_BUCKET         — destination bucket for generated avatars
 *
 * IAM grants required (added in backend.ts):
 *   ssm:GetParameter on the OpenAI key parameter
 *   kms:Decrypt on alias/aws/ssm
 *   s3:PutObject on the avatar bucket
 *   bedrock:InvokeModel (AmazonBedrockFullAccess)
 *   appsync:GraphQL on the data API
 */
export const botchatTrigger = defineFunction({
  name: 'botchat-trigger',
  entry: './handler.js',
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
