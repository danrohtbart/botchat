/* Amplify Params - DO NOT EDIT
	API_BOTCHAT_CHATTABLE_ARN
	API_BOTCHAT_CHATTABLE_NAME
	API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT
	API_BOTCHAT_GRAPHQLAPIIDOUTPUT
	API_BOTCHAT_PERSONALITIESTABLE_ARN
	API_BOTCHAT_PERSONALITIESTABLE_NAME
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const { BedrockRuntimeClient, ConverseCommand }  = require('@aws-sdk/client-bedrock-runtime');
const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/api');

// Set these to false for normal production operation
const debug = false;
const debug_admin = false; // dangerous: this dumps the entire Bedrock config to the log
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
      thread_id
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
        user_email
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

const listChats = /* GraphQL */ `
  query ListChats(
    $filter: ModelChatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChats(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        message
        message_in_thread
        user_email
        speaker_name
        thread_id
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

    /**
     * Initialization section. Quickly return if the result can't be 200. 
     */

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

    // Default personalities, in case there is no personality for this user
    let name_1 = "Jim";
    let personality_1 = "You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments.";
    let name_2 = "Mark";
    let personality_2 = "You are a sports talk radio host from Philadelphia, named Mark Waterice. You are polite, smart, and firm. You have strong opinions, and do not present counter-arguments.";

    /**
     *  Retrieve personalities section
     */

    const amplify_config = {
        "aws_project_region": process.env.REGION,
        "aws_appsync_graphqlEndpoint": process.env.API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT,
        "aws_appsync_region": process.env.REGION,
        "aws_appsync_authenticationType": "AWS_IAM",
    }

    Amplify.configure(amplify_config, {
        Auth: {
            credentialsProvider: {
                getCredentialsAndIdentityId: async () => ({
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        sessionToken: process.env.AWS_SESSION_TOKEN,
                    }
                }),
                clearCredentialsAndIdentityId: async () => {},
            }
        }
    });

    const amplifyClient = generateClient();

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
    
    /**
     * Now that we have the Personality, let's get started on the Chat
     */

    const last_statement = incoming_content.message.S || '';
    const last_speaker = incoming_content.speaker_name.S || '';
    const message_in_thread = parseInt(incoming_content.message_in_thread.N) || 0;
    let thread_id = '';
    if (incoming_content.thread_id) {
        thread_id = incoming_content.thread_id.S;
    } 

    if(debug) {
        console.log("Last speaker " + last_speaker);
        console.log("Last statement " + last_statement);
        console.log("Message in thread " + message_in_thread);
    }

    if (message_in_thread > max_thread) {
        // Future optimization: move this to Initialization
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
        * Moved to AWS Bedrock Converse API, to abstract away the specific model
        */

        const bedrock_converse_system_prompt = [{ text: speaker_personality + ". Do not mention specific people who were alive when the model was trained. Do not repeat the prompt. Your response should only be one person speaking." }];

        // Converse API introducted in Summer 2024
        let bedrock_converse_messages = [];

        if(debug) {
            console.log("Speaker name is", speaker_name);
        }
        
        if (message_in_thread == 0) {
            // Simple case. User has just asked the question. 
            bedrock_converse_messages.push({
                role: "user",
                content: [{ text: last_statement.replace(/\n/g, ' ') }]
            });
        } else {
            // Retrieve all chats in this thread_id, sorted in order of message_in_thread. Iterate through them by message_in_thread,  appending them to prompt. Remove any line breaks, just in case.
            try {
                const all_chats = await amplifyClient.graphql({
                    query: listChats,
                    variables: {
                        filter: {
                            thread_id: { eq: thread_id }
                            // user_email: { eq: incoming_user_email } // this is the authenticated user's email address
                        },
                    },
                });
                if (debug) {
                    console.log ("all_chats ", all_chats.data.listChats.items);
                }
                let chat_messages = all_chats.data.listChats.items;
                chat_messages.sort(function(a, b) {
                    return a.message_in_thread - b.message_in_thread;
                });
                if (debug) {
                    console.log ("Sorted chat_messages ", chat_messages);
                }

                // Handle the slightly unusual first message: it is always the User's prompt
                bedrock_converse_messages.push({
                    role: "user",
                    content: [{ text: chat_messages[0].message.replace(/\n/g, ' ') }]
                });

                // Iterate through the rest of the messages IN PAIRS, appending them to the prompt.
                // Trade-off decision: when chat_messages is even and >0. To prompt the bot correctly, we're skipping the first response by the prior bots. 
                let start = 1;
                if (chat_messages.length % 2 == 0) {
                    start = 2;
                    if (debug) {
                        console.log("chat_messages.length is even", chat_messages.length);
                    }    
                }

                for (let i = start; i < chat_messages.length - 1; i += 2) {
                    if (debug) {
                        console.log("i is", i);
                        console.log("chat_messages[i].message is", chat_messages[i].message);
                        console.log("chat_messages[i+1].message is", chat_messages[i+1].message);
                    }
                    
                    bedrock_converse_messages.push({
                        role: "assistant",
                        content: [{ text: chat_messages[i].message.replace(/\n/g, ' ') }]
                    });
                    bedrock_converse_messages.push({
                        role: "user",
                        content: [{ text: chat_messages[i+1].message.replace(/\n/g, ' ') }]
                    });
                }
            } catch (error) {
                bedrock_converse_messages.push({
                        role: "user",
                        content: [{ text: last_statement.replace(/\n/g, ' ') }]
                });
                console.log("Warning: unable to retrieve chats. This bot will respond based on the last message, without any additional context. ", error);
            }
        }

        /** 
         * Select which model will power the Bedrock request
         * Default is Meta Llama Instruct "meta.llama3-70b-instruct-v1:0";
         */
        let modelId = "meta.llama3-70b-instruct-v1:0"; // Default
//        modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0"; // Working
//        modelId = "mistral.mistral-large-2402-v1:0" // Working
//        modelId = "ai21.jamba-instruct-v1:0" // Working
//        modelId = "cohere.command-r-plus-v1:0" // Working




        /**
         * Configure the Bedrock request for the Converse API 
         */
        const bedrock_converse_params = {
            maxTokens: length,
            temperature: temperature,
            top_p: top_p
          };


        /**
         * Configure the BedrockRuntimeClient
         */
        const aws_sdk_config = {
            region: 'us-east-1',
        }


        if (debug_admin) {
            console.log("Bedrock config is", aws_sdk_config); 
            //console.log("Parameters: ", Parameters)
        }
        if (debug) {
            console.log("bedrock_converse_messages is", bedrock_converse_messages);
            for (let i = 0; i < bedrock_converse_messages.length; i++) {
                console.log("bedrock_converse_messages ", i, ": ", bedrock_converse_messages[i]);
            }
        }        

        let message = '';
        if(mock_bedrock) {
            message = "Yo, what's up folks? It's Jim Hoagies here, and I gotta say, that game last night was a freakin' joke. The Ravens? They're a real team, they know how to get the job done. But the Jaguars? They're a bunch of scrubs, they don't belong on the same field as the Ravens. I mean, come on, they got shut out ";
        } else {
            const bedrock_client = new BedrockRuntimeClient(aws_sdk_config);
            if(debug) {
                console.log("Running with Converse API.");
            }
            const converse_command = new ConverseCommand({ 
                modelId: modelId, 
                messages: bedrock_converse_messages,
                system: bedrock_converse_system_prompt, 
                inferenceConfig: bedrock_converse_params, 
            });
            const converse_response = await bedrock_client.send(converse_command);
            if (debug) {
                console.log("Full Response from Bedrock Converse is", converse_response);
                // iterate through the converse_response.output.message.content array
                for (let i = 0; i < converse_response.output.message.content.length; i++) {
                    console.log("content ", i, ": ", converse_response.output.message.content[i]);
                }
            }
            message = converse_response.output.message.content[0].text || '';
        }
        if (debug) {
            console.log("Full message body from Bedrock is:", message);
        }
        // Trim off any sentence fragments. Keep only the content to the left of the last punctuation in message. 
        // Originally the code only checked for periods. Bots are expressive and sometimes use only exclamation points!
        const last_period = message.lastIndexOf(".")+1;
        const last_exclamation = message.lastIndexOf("!")+1;
        const last_question = message.lastIndexOf("?")+1;
        let last_punctuation = Math.max(last_period, last_exclamation, last_question);
        message = message.substring(0, last_punctuation);

        if (debug) {
            console.log("Message is ", message);
        }
        if (message == '') {
            console.warn("Warning: empty message returned by Bedrock.");
            message = "I'm speechless. ";
        }

    const output = {
        message: message,
        message_in_thread: message_in_thread + 1,
        user_email: incoming_user_email,
        speaker_name: speaker_name,
        thread_id: thread_id,
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

      console.log("OUTPUT: ", output);
  }

  return Promise.resolve('Successfully processed DynamoDB record');
};
