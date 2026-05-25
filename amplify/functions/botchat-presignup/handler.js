/**
 * Cognito Pre-Signup trigger.
 *
 * NOTE: With Gen 2 referenceAuth, this trigger is NOT attached to the user pool
 * by Amplify — referenceAuth cannot modify the referenced pool's LambdaConfig.
 * The trigger is attached out-of-band via:
 *   aws cognito-idp update-user-pool --user-pool-id <pool> --lambda-config PreSignUp=<arn>
 * See CLAUDE.md ("amplify push silently clears the Cognito pre-signup trigger").
 *
 * Must use async/await — callback-based handlers do not work with ESM bundles.
 */
export const handler = async (event) => {
  const email_address = event.request.userAttributes.email.toLowerCase();
  const domain = email_address.split('@')[1];

  const acceptableDomains = ['rohtbart.com', 'aetion.com', 'arccosgolf.com'];
  const acceptableAddresses = [
    'bobschwartz314@gmail.com',
    'aglazer@fourcubits.com',
    'jets613@gmail.com',
    'betsymorserohtbart@gmail.com',
  ];

  if (acceptableDomains.includes(domain) || acceptableAddresses.includes(email_address)) {
    return event;
  }
  throw new Error('Sorry, we are not yet open to the internet. Ask Dan.');
};
