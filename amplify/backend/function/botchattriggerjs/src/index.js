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
const prevent_write = false;

if (debug) {
    console.log('Loading botchattriggerjs.');
}

const length = 100;
const max_thread = 6;
const temperature = 0.9;
const top_p = 0.1;

// Needed to hardcode the GraphQL into this function because I was struggling with importing it from ../../../../../src/graphql/mutations and queries
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
    
const listPersonalities = /* GraphQL */ `
  query ListPersonalities(
    $filter: ModelPersonalitiesFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPersonalities(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name_1
        personality_1
        name_2
        personality_2
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    if (event.Records[0].eventName == "REMOVE") {
            console.log("This is a REMOVE event. Ignoring it.");
            return {
                statusCode: 200
            };
    }
        
    /*
    * Focusing only on Records[0] is losing messages. Future improvement: iterate here.
    */
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

    // Retrieve personalities using GraphQL
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

    let name_1 = "Jim";
    let personality_1 = "You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments.";
    let name_2 = "Mark";
    let personality_2 = "You are a sports talk radio host from Philadelphia, named Mark Waterice. You are polite, smart, and firm. You have strong opinions, and do not present counter-arguments.";
    const incoming_user_email = incoming_content.user_email.S || '';
    if (debug) {
        console.log("Incoming user email is", incoming_user_email);
    }

    try {
        const all_personalities = await amplifyClient.graphql({
            query: listPersonalities,
            variables: {
                filter: {
                  user_email: { eq: incoming_user_email } // this is the authenticated user's email address
                }
              },
        });
        if (debug) {
            console.log ("all_personalities ", all_personalities.data.listPersonalities.items);
        }

        // Assumes that there is only one personality per owner. The front end handles managing how many personalities there are per owner.
        const owner_personality = all_personalities.data.listPersonalities.items[0];

        if (owner_personality) {
            if (owner_personality.length > 1) {
                console.log("Warning: user ", incoming_content.email_address, "has too many personalities: ", owner_personality.length)
            }
             // Assumes that there is only one personality per owner. The front end handles managing how many personalities there are per owner. 
            name_1 = owner_personality.name_1;
            personality_1 = owner_personality.personality_1;
            name_2 = owner_personality.name_2;
            personality_2 = owner_personality.personality_2;
        } else {
            throw ("No personalities found for incoming_user_email " + incoming_user_email);
        }
    } catch (error) {
        console.log("Error retrieving personalities", error);
    };
    if (debug) {
        console.log("Name 1 is", name_1);
        console.log("Personality 1 is", personality_1);
        console.log("Name 2 is", name_2);
        console.log("Personality 2 is", personality_2);
    }
    

    const last_statement = incoming_content.message.S || '';
    const last_speaker = incoming_content.speaker_name.S || '';
    const message_in_thread = parseInt(incoming_content.message_in_thread.N) || 0;

    if(debug) {
        console.log("Last speaker " + last_speaker);
        console.log("Last statement " + last_statement);
        console.log("Message in thread " + message_in_thread);
    }

    if (message_in_thread > max_thread) {
        console.log("Stopping the conversation after", message_in_thread, "statements.");
        return {
            statusCode: 204
        }
    } else {
        let speaker_name, speaker_personality;
        // Using the last_speaker, determine who will speak. 
        if (last_speaker != name_1) {
            // Bot 1 will speak by default - the only time they don't speak is if they just spoke. 
            speaker_name = name_1;
            speaker_personality = personality_1;
        } else {
            speaker_name = name_2;
            speaker_personality = personality_2;
        }

        /*
        * Prompt Engineering Section
        * https://huggingface.co/blog/llama2#how-to-prompt-llama-2
        *  https://www.reddit.com/r/LocalLLaMA/comments/1561vn5/here_is_a_practical_multiturn_llama2chat_prompt/
        * The desired grammar is:
<s>[INST] <<SYS>>
{{ system_prompt }}
<</SYS>>

{{ user_msg_1 }} [/INST] {{ model_answer_1 }} </s><s>[INST] {{ user_msg_2 }} [/INST]

        */        

        let prompt = "<s>[INST]";
        let instruction = " <<SYS>> \n" + speaker_personality + "\nDo not mention specific people who were alive when the model was trained. Do not repeat the prompt. Your response should only be one person speaking. You should respond to this opinion: <</SYS>>\n\n";

        if(debug) {
            console.log("Speaker name is", speaker_name);
            console.log("Instruction is", instruction);
        }

        prompt += instruction;
        
        // Retrieve all chats in this thread, in order. Iterate through them, appropriately appending them to prompt. Remove any line breaks, just in case. 
        /* TK */
        prompt += last_statement.replace(/\n/g, ' ') + "[/INST]";

        bedrock_request_body = {
            body: JSON.stringify({
                prompt: prompt,
                temperature: temperature,
                top_p: top_p,
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
            // console.log("Bedrock config is", aws_sdk_config); // Prints credentials
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
        if (debug) {
            console.log("Full message from Bedrock is:", message);
        }
        // Trim off any sentence fragments. Keep only the content to the left of the last "." in message
        message = message.substring(0, message.lastIndexOf(".")+1);

        if (debug) {
            console.log("Message is ", message);
        }
        if (message == '') {
            message = "I'm speechless. ";
        }


    const output = {
        message: message,
        message_in_thread: message_in_thread + 1,
        user_email: incoming_user_email,
        speaker_name: speaker_name,
    };

    if (debug) {
        console.log("CreateChat is", createChat);
        console.log("Message is", message);
    }

    if (!prevent_write) {
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
    }

      console.log(`OUTPUT: ${JSON.stringify(output)}`);
  }

  return Promise.resolve('Successfully processed DynamoDB record');
};
