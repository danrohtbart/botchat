import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'us-east-1_zqHzRhn3Q',
  userPoolClientId: '72buq73ussd5tdbqv5hkddegap',
  identityPoolId: 'us-east-1:f7ca3644-f4b1-4d0b-9be4-7e815f84afbe',
  authRoleArn: 'arn:aws:iam::253178317163:role/botchat-prod-authRole',
  unauthRoleArn: 'arn:aws:iam::253178317163:role/botchat-prod-unauthRole',
});
