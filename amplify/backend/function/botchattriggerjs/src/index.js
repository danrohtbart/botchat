/* Amplify Params - DO NOT EDIT
	API_BOTCHAT_BOTTABLE_ARN
	API_BOTCHAT_BOTTABLE_NAME
	API_BOTCHAT_CHATTABLE_ARN
	API_BOTCHAT_CHATTABLE_NAME
	API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT
	API_BOTCHAT_GRAPHQLAPIIDOUTPUT
	API_BOTCHAT_GRAPHQLAPIKEYOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const { BedrockRuntimeClient, InvokeModelCommand }  = require('@aws-sdk/client-bedrock-runtime');
const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/api');

const debug = false;
const mock_bedrock = false;
const drain_queue = false;

if (debug) {
    console.log('Loading botchatlambdajs.');
}

const length = 100;
const personalities = {
    "Jim": "[INST]You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments. Do not mention specific players. Do not repeat the prompt.[/INST]\n\n", 
    "Mark": "[INST]You are a sports talk radio host from Philadelphia, named Mark Waterice. You are polite, smart, and firm. You have strong opinions, and do not present counter-arguments. Do not mention specific players. Do not repeat the prompt.[/INST]\n\n"
}


/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

    /*
    * Focusing only on Records[0] is losing messages. Future improvement: iterate here.
    */

    if (event.Records[0].eventName == "REMOVE") {
            console.log("This is a REMOVE event. Ignoring it.");
            return {
                statusCode: 200
            };
    }

    const incoming_message = event.Records[0].dynamodb; 
    if (debug) {
        console.log("Incoming message is", incoming_message);
    }


    const incoming_content = incoming_message.NewImage;

    if (debug) {
        console.log("Incoming content is", incoming_content);
    }
    if (drain_queue){
        console.log("Drain queue is true. Draining queue of this event.");
        return {
            statusCode: 200
        };
    }

    const last_statement = incoming_content.message.S || '';
    const last_speaker = incoming_content.speaker_name.S || '';
    const message_in_thread = parseInt(incoming_content.message_in_thread.N) || 0;

    if(debug) {
        console.log("Last speaker " + last_speaker);
        console.log("Last statement " + last_statement);
        console.log("Message in thread " + message_in_thread);
    }

    if (last_speaker == "Jim" && parseInt(message_in_thread) == 1) {
        console.log("Jim should never speak first. Stopping the conversation after", message_in_thread, "statements. He said", last_statement);
        return {
            statusCode: 204
        };
    };

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

        const prompt = instruction + '\n\n' + last_speaker + ": " + last_statement + "\nRespond to that opinion."

        bedrock_request_body = {
            body: JSON.stringify({
                prompt: prompt,
                temperature: 0.8,
                top_p: 0.1,
                max_gen_len: length,
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
            const bedrock_response = await bedrock_client.send(bedrock_command);
            message = JSON.parse(Buffer.from(bedrock_response.body).toString()).generation || '';
        }
        // Trim off any sentence fragments. Keep only the content to the left of the last . in message
        message = message.substring(0, message.lastIndexOf(".")+1);

        if (debug) {
            console.log("Message is ", message);
        }
        if (message == '') {
            message = "I'm speechless. ";
        }

        const amplify_config = {
            "aws_project_region": process.env.REGION,
            "aws_appsync_graphqlEndpoint": process.env.API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT,
            "aws_appsync_region": process.env.REGION,
            "aws_appsync_authenticationType": "API_KEY",
            "aws_appsync_apiKey": process.env.API_BOTCHAT_GRAPHQLAPIKEYOUTPUT,
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
        const amplify_result = await amplifyClient.graphql({
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

      console.log(`OUTPUT: ${JSON.stringify(output)}`);
  }

  return Promise.resolve('Successfully processed DynamoDB record');
};
