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
  entry: './handler.js',
  runtime: 20,
  timeoutSeconds: 90,
  memoryMB: 512,
  // Place this function in the data stack to avoid the circular dependency
  // between the function and data nested stacks. data uses
  // allow.resource(botchatTrigger), and we add IAM grants in backend.ts that
  // also reference data.resources.graphqlApi.arn — both directions need
  // resolution at deploy time, which only works if both live in one stack.
  resourceGroupName: 'data',
  environment: {
    // Other env vars (AVATAR_S3_BUCKET, REGION, API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT)
    // are set in amplify/backend.ts via addEnvironment so they share the
    // same branch-aware ENV_CONFIG lookup.
    OPENAI_API_KEY_SSM_PATH: '/botchat/openai-api-key',
  },
});
