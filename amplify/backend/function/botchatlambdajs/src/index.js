const { BedrockRuntimeClient, InvokeModelCommand }  = require('@aws-sdk/client-bedrock-runtime');
const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/api');

const debug = true;

if (debug) {
    console.log('Loading botchatlambdajs.');
}

const personalities = {
    "Jim": "[INST]You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments. Do not repeat the prompt.[/INST]\n\n", 
    "Mark": "[INST]You are a sports talk radio host from Philadelphia, named Mark Waterice. You are polite, smart, and firm. You have strong opinions, and do not present counter-arguments. Do not repeat the prompt.[/INST]\n\n"
}

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    const last_statement = event['message'] || '';
    const last_speaker = event['speaker_name'] || '';
    const message_in_thread = event['message_in_thread'] || 0;

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

        const prompt = instruction + last_statement + "\nRespond to that opinion."

        bedrock_request_body = {
            body: JSON.stringify({
                prompt: prompt,
                temperature: 0.9,
                top_p: 0.1,
                max_gen_len: 255,
            }),
            contentType: "application/json",
            accept: "application/json",
            modelId: "meta.llama2-70b-chat-v1"
        }
        const bedrock_config = {
            region: 'us-east-1',
            credentials: {
                accessKeyId: '***REMOVED***',
                secretAccessKey: '***REMOVED***'
            }
        }
        if (debug) {
            console.log("Bedrock config is", bedrock_config);
            console.log("Bedrock request body is", bedrock_request_body);
        }        

        const bedrock_client = new BedrockRuntimeClient(bedrock_config);
        const bedrock_command = new InvokeModelCommand(bedrock_request_body);
        const bedrock_response = await bedrock_client.send(bedrock_command);
        let message;
        message = JSON.parse(Buffer.from(bedrock_response.body).toString()).generation || '';
        if (debug) {
            console.log("Message is ", message);
        }

        if (message == '') {
            message = "I'm speechless. ";
        }

        // Start here - the error is "no credentials"
        Amplify.configure(bedrock_config);
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

        // Same function is used in the React page. Opportunity for refactoring. Needed to hardcode the GraphQL into this function because I was struggling with importing it from ../../../../../src/graphql/mutations
        await amplifyClient.graphql({
            query: createChat,
            variables: {
                input: {
                    message: message,
                    user_email: speaker_name,
                    message_in_thread: message_in_thread + 1
                }, 
            }
        });

    }

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
