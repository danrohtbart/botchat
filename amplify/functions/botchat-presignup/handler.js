/**
 * Cognito Pre-Signup trigger.
 *
 * NOTE: With Gen 2 referenceAuth, this trigger is NOT attached to the user pool
 * by Amplify — referenceAuth cannot modify the referenced pool's LambdaConfig.
 * The trigger is attached out-of-band via:
 *   aws cognito-idp update-user-pool --user-pool-id <pool> --lambda-config PreSignUp=<arn>
 * See CLAUDE.md ("amplify push silently clears the Cognito pre-signup trigger").
 */
export const handler = (event, context, callback) => {
  const email_address = event.request.userAttributes.email.toLowerCase();
  const address = event.request.userAttributes.email.split('@');
  const domain = address[1].toLowerCase();

  const acceptableDomains = ['rohtbart.com', 'aetion.com', 'arccosgolf.com'];
  const acceptableAddresses = [
    'bobschwartz314@gmail.com',
    'aglazer@fourcubits.com',
    'jets613@gmail.com',
    'betsymorserohtbart@gmail.com',
  ];

  if (acceptableDomains.includes(domain) || acceptableAddresses.includes(email_address)) {
    callback(null, event);
  } else {
    callback('Sorry, we are not yet open to the internet. Ask Dan.', null);
  }
};
