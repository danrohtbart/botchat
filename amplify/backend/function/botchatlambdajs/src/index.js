/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */
const { BedrockRuntimeClient, InvokeModelCommand }  = require('@aws-sdk/client-bedrock-runtime');
const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/api');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');


const debug = false;
const mock_bedrock = false;
const drain_queue = false;
const deactivate = true;

if (debug) {
    console.log('Loading botchatlambdajs.');
}

const personalities = {
    "Jim": "[INST]You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments. Do not mention specific players. Do not repeat the prompt.[/INST]\n\n", 
    "Mark": "[INST]You are a sports talk radio host from Philadelphia, named Mark Waterice. You are polite, smart, and firm. You have strong opinions, and do not present counter-arguments. Do not mention specific players. Do not repeat the prompt.[/INST]\n\n"
}

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    if (!deactivate) {
    const incoming_message = JSON.parse(event.Records[0].body);
    const incoming_content = JSON.parse(incoming_message.Message);

    if (debug) {
        console.log("Incoming message is", incoming_message);
        console.log("Type of incoming_message.Message is", typeof incoming_message.Message);
        console.log("Incoming message.Message is", incoming_message.Message);
    }
    if (drain_queue){
        console.log("Drain queue is true. Draining queue of this event.");
        return {
            statusCode: 200
        }
    }

    /* Next action 12/19/2023 - parse the incoming_message. It's working now that I'm stringifying from the client */
    const last_statement = incoming_content.message || '';
    const last_speaker = incoming_content.speaker_name || '';
    const message_in_thread = incoming_content.message_in_thread || 0;

    if(debug) {
        console.log("Last speaker " + last_speaker);
        console.log("Last statement " + last_statement);
        console.log("Message in thread " + message_in_thread);
    }

    if (message_in_thread > 3) {
        console.log("Stopping the conversation after", message_in_thread, "statements.");
        return {
            statusCode: 204
        }
    } else {
        let speaker_name;
        if (last_speaker == "Jim") {
            speaker_name = "Mark";
        } else {
            speaker_name = "Jim";
        }
        const instruction = personalities[speaker_name];

        if(debug) {
            console.log("Speaker name is", speaker_name);
            console.log("Instruction is", instruction);
        }

        const prompt = instruction + last_speaker + ": " + last_statement + "\nRespond to that opinion."

        bedrock_request_body = {
            body: JSON.stringify({
                prompt: prompt,
                temperature: 0.8,
                top_p: 0.1,
                max_gen_len: 200,
            }),
            contentType: "application/json",
            accept: "application/json",
            modelId: "meta.llama2-70b-chat-v1"
        }
        const aws_sdk_config = {
            region: 'us-east-1',
            credentials: {
                accessKeyId: '***REMOVED***',
                secretAccessKey: '***REMOVED***'
            }
        }
        if (debug) {
            console.log("Bedrock config is", aws_sdk_config);
            console.log("Bedrock request body is", bedrock_request_body);
        }        

        let message = '';
        if(mock_bedrock) {
            message = "Yo, what's up folks? It's Jim Hoagies here, and I gotta say, that game last night was a freakin' joke. The Ravens? They're a real team, they know how to get the job done. But the Jaguars? They're a bunch of scrubs, they don't belong on the same field as the Ravens. I mean, come on, they got shut out ";
        } else {
            const bedrock_client = new BedrockRuntimeClient(aws_sdk_config);
            const bedrock_command = new InvokeModelCommand(bedrock_request_body);
            const bedrock_response = /*await*/ bedrock_client.send(bedrock_command);
            message = JSON.parse(Buffer.from(bedrock_response.body).toString()).generation || '';
        }
        // Keep only the content to the left of the last . in message
        message = message.substring(0, message.lastIndexOf(".")+1);


        if (debug) {
            console.log("Message is ", message);
        }
        if (message == '') {
            message = "I'm speechless. ";
        }

        const amplify_config = {
            "aws_project_region": "us-east-1",
            "aws_appsync_graphqlEndpoint": "https://isjrfishhffyvkjvf63huj5wm4.appsync-api.us-east-1.amazonaws.com/graphql",
            "aws_appsync_region": "us-east-1",
            "aws_appsync_authenticationType": "API_KEY",
            "aws_appsync_apiKey": "da2-nx6urtyn4nekbef6osiwlkoec4",
            "aws_cognito_identity_pool_id": "us-east-1:6ac7fc59-ae90-4578-b5fb-fd8b528547f4",
            "aws_cognito_region": "us-east-1",
            "aws_user_pools_id": "us-east-1_AYMzkIGAz",
            "aws_user_pools_web_client_id": "6q6isgm1ohotk12v5rojoi7uj1",
            "oauth": {},
            "aws_cognito_username_attributes": [
              "EMAIL"
            ],
            "aws_cognito_social_providers": [],
            "aws_cognito_signup_attributes": [
              "EMAIL"
            ],
            "aws_cognito_mfa_configuration": "OFF",
            "aws_cognito_mfa_types": [
              "SMS"
            ],
            "aws_cognito_password_protection_settings": {
              "passwordPolicyMinLength": 8,
              "passwordPolicyCharacters": []
            },
            "aws_cognito_verification_mechanisms": [
              "EMAIL"
            ]
          }

        Amplify.configure({
            ...amplify_config,
        });

        const amplifyClient = generateClient();
        const createChat = /* GraphQL */ `
        mutation CreateChat(
          $input: CreateChatInput!
          $condition: ModelChatConditionInput
        ) {
          createChat(input: $input, condition: $condition) {
            id
            message
            message_in_thread
            user_email
            speaker_name
            createdAt
            updatedAt
            owner
            __typename
          }
        }
      `;


        const output = {
            message: message,
            message_in_thread: message_in_thread + 1,
            user_email: 'dan@rohtbart.com',
            speaker_name: speaker_name,
          };

        if (debug) {
            console.log("CreateChat is", createChat);
            console.log("Message is", message);
        }

        // Needed to hardcode the GraphQL into this function because I was struggling with importing it from ../../../../../src/graphql/mutations
        try {
            const amplify_result = /*await*/ amplifyClient.graphql({
                query: createChat,
                variables: {
                    input: output, 
                }
            });
            if (debug) {
                console.log("Amplify result is", amplify_result);
            }
        } catch (error) {
            console.log("Amplify GraphQL error is", JSON.stringify(error));
        }

        try {
            const sns_client = new SNSClient({
                region: 'us-east-1', 
                credentials: {
                accessKeyId: '***REMOVED***',
                secretAccessKey: '***REMOVED***'
                }
            });
            const input = {
                Message: JSON.stringify(output),
                TopicArn: 'arn:aws:sns:us-east-1:253178317163:sports_radio_message_sns.fifo',
                "MessageGroupId": "0"
                }
            const sns_command = new PublishCommand(input); 
            const sns_response = await sns_client.send(sns_command);
        } catch (error) {
            console.log("SNS error is", JSON.stringify(error));
        }
        console.log(`OUTPUT: ${JSON.stringify(output)}`);
    }
    } // if (!deactivate)

    return {
        statusCode: 200,
    //  Uncomment below to enable CORS requests
    //  headers: {
    //      "Access-Control-Allow-Origin": "*",
    //      "Access-Control-Allow-Headers": "*"
    //  },
        body: JSON.stringify('Hello from Lambda!'),
    };
};
