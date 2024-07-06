

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = (event, context, callback) => {
    // Split the email address so we can compare domains
    var email_address = event.request.userAttributes.email;
    var address = event.request.userAttributes.email.split("@")
    var domain = address[1];

    const acceptableDomains = ['rohtbart.com', 'aetion.com'];
    const acceptableAddresses = ['Bobschwartz314@gmail.com', 'aglazer@fourcubits.com', 'jets613@gmail.com', 'betsymorserohtbart@gmail.com'];
    
    if (acceptableDomains.includes(domain) || acceptableAddresses.includes(email_address)) {
        // Success! Return to Amazon Cognito
        callback(null, event);
    } else {
        // Fail!
        callback("Sorry, we are not yet open to the internet. Ask Dan.", null);
    }
};

