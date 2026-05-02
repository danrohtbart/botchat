import { referenceAuth } from '@aws-amplify/backend';

const branch = process.env.AWS_BRANCH ?? 'dev';

const envConfig = {
  dev: {
    userPoolId: 'us-east-1_D4wZSVZIu',
    userPoolClientId: '1ot261erfpdbkoefd9vk7fu0jh',
    identityPoolId: 'us-east-1:9f0a8287-8d39-492c-aaa3-f8ea27404b8d',
    authRoleArn: 'arn:aws:iam::253178317163:role/amplify-botchat-dev-135408-authRole',
    unauthRoleArn: 'arn:aws:iam::253178317163:role/amplify-botchat-dev-135408-unauthRole',
  },
  main: {
    userPoolId: 'us-east-1_N9z5Z5X2w',
    userPoolClientId: 'TBD-main-pool-client-id',
    identityPoolId: 'us-east-1:77f88067-5c22-4694-99cd-a16e77aac68f',
    authRoleArn: 'arn:aws:iam::253178317163:role/amplify-botchat-main-223437-authRole',
    unauthRoleArn: 'arn:aws:iam::253178317163:role/amplify-botchat-main-223437-unauthRole',
  },
} as const;

const config = envConfig[branch as keyof typeof envConfig] ?? envConfig.dev;

export const auth = referenceAuth(config);
