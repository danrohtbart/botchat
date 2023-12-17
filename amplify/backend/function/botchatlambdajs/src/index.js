//import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"; // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-runtime/command/InvokeModelCommand/
const { BedrockRuntimeClient, InvokeModelCommand }  = require('@aws-sdk/client-bedrock-runtime');

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

        // const prompt = instruction + last_statement + "\nRespond to that opinion."
        const prompt = "Tell me about llamas."

        bedrock_request_body = {
            body: prompt,
            contentType: "STRING_VALUE",
            accept: "STRING_VALUE",
//            temperature: 0.9,
//            top_p: 0.1, 
//            max_gen_len: 255,
            modelId: 'meta.llama2-70b-chat-v1',
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
        const response = await bedrock_client.send(bedrock_command);
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
