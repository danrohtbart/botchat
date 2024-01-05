

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = (event, context, callback) => {
    // Split the email address so we can compare domains
    var address = event.request.userAttributes.email.split("@")
    var domain = address[1];
    
    if (domain == "rohtbart.com" || domain == "aetion.com") {
        // Success! Return to Amazon Cognito
        callback(null, event);
    } else {
        // Fail!
        callback("Error: Domain not allowed", null);
    }
};

