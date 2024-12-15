This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.


## Bot Chat setup
Bot Chat is an AWS Amplify app. Amplify created the auth, api, DynamoDB, and lambda functions. 

After deploying, check the IAM role `botchatLambdaRole????????-???`. If it does not have the `AmazonBedrockFullAccess` policy attached yet, you need to attach it. (It should, but this is the most likely troubleshooting issue)

### Restricting to an allow-list (optional, and not currently active)
If you want to restrict to an allow-list, use the botchatpresignup lambda. Cognito is *not* set up by default to use the botchatpresignup lambda. After deploying, you must go to Cognito, open the user pool, go into User Pool Properties, and add the lambda trigger. This is required for every environment (dev, main) where you want the allow-list control. 
https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html

## Warnings
Local development is not least-privilege, and might be incompletely documented. My local development user has these policies: 
* AdministratorAccess-Amplify
* AmazonBedrockFullAccess
* AmazonSNSFullAccess // I think this isn't needed anymore
* AmazonSSMReadOnlyAccess
* AmplifyBackendDeployFullAccess
* SecretsManagerReadWrite

## Resolving Dependabot findings
Let's say you get a Dependabot alert. Here's how to upgrade versions and resolve it. This is single-player mode, working in the `main` branch. 
These instructions are temporary - I've turned on PR creation for future alerts. 
* Open IDE on the development machine
* Checkout the branch for the PR
* Pull - make sure you've got the most updated code
* If you updated a function
1. Run the local tests
```
TBD
```
1. Push backend to development server
* Run local webserver
* Manually test on local
* Merge PR
* Checkout `main` on local machine, to leave it in the right state