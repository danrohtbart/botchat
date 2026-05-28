// Env vars consumed (all set by amplify/backend.ts or the function resource):
//   AMPLIFY_DATA_GRAPHQL_ENDPOINT         — Gen 2 AppSync URL (primary).
//   API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT  — Gen 1 fallback AppSync URL.
//   REGION                                 — AWS region.
//   AVATAR_S3_BUCKET                       — destination bucket.
//   OPENAI_API_KEY_SSM_PATH                — SSM path to OpenAI key.
// AWS_ACCESS_KEY_ID/SECRET/SESSION_TOKEN are auto-injected by Lambda.

import https from 'https';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, ConverseCommand, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

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

// Two-step avatar generation:
// 1. Llama3 writes a detailed caricature image prompt from the personality description
// 2. DALL-E 2 renders the actual image via OpenAI API
const PROMPT_MODEL_ID = 'meta.llama3-70b-instruct-v1:0';

// OpenAI key is fetched from SSM at cold start and cached for the container lifetime
let _openAiKey = null;
async function getOpenAiKey() {
    if (_openAiKey) return _openAiKey;
    const ssmPath = process.env.OPENAI_API_KEY_SSM_PATH || process.env.OPENAI_API_KEY;
    if (!ssmPath || !ssmPath.startsWith('/')) {
        // Fallback: env var holds the key directly (local testing)
        _openAiKey = ssmPath;
        return _openAiKey;
    }
    const ssm = new SSMClient({ region: 'us-east-1' });
    const resp = await ssm.send(new GetParameterCommand({ Name: ssmPath, WithDecryption: true }));
    _openAiKey = resp.Parameter.Value;
    return _openAiKey;
}

// GraphQL operations — generated from src/graphql/ by `npm run sync-lambda-graphql`
import { createChat, updatePersonalities, listPersonalities, listChats } from './graphql.js';

function configureAmplify() {
    const amplify_config = {
        "aws_project_region": process.env.REGION,
        "aws_appsync_graphqlEndpoint":
            process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT
            || process.env.API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT,
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

    return generateClient();
}

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // DDB streams arrive in BATCHES (batchSize: 10 for Personalities,
    // 100 for Chat in our config). Process each record. The Gen 1
    // implementation only handled Records[0] which silently lost any
    // batched events — that's how the e2e personality-edit test caught
    // the avatar regression: the user's edit happened to be Records[1]
    // in a 2-record batch.
    for (const record of event.Records) {
        if (record.eventName === 'REMOVE') {
            console.log(`Skipping REMOVE event ${record.eventID}`);
            continue;
        }
        const eventSourceARN = record.eventSourceARN || '';
        try {
            if (eventSourceARN.includes('Personalities')) {
                await handlePersonalitiesEvent(record);
            } else {
                await handleChatEvent(record);
            }
        } catch (err) {
            // Log + swallow so a single bad record doesn't block the rest
            // of the batch. DDB stream redrives the whole batch on throw.
            console.error(`Failed to process record ${record.eventID}`, err);
        }
    }
    return { statusCode: 200 };
};

// ─── Personalities stream handler ────────────────────────────────────────────
//
// Generates a portrait image with Bedrock for each personality slot whose text
// changed, then writes the base64 PNGs back to image_1 / image_2 on the same
// record. Loop guard: if the only fields that changed are image_1 / image_2
// (this Lambda's own write echoing back through the stream), short-circuit.

function ddbStringValue(image, field) {
    if (!image || !image[field]) return null;
    return image[field].S || null;
}

async function generatePortraitImage(promptText, name) {
    // Step 1: Use Llama3 to write a detailed caricature prompt
    const metaPrompt =
        `You are a caricature artist's assistant. Write a DALL-E image generation prompt for a caricature portrait of a character named ${name}.\n` +
        `Their personality: "${promptText}"\n\n` +
        `A caricature exaggerates the most defining trait as a physical feature. ` +
        `Identify the single most dominant trait and describe exactly what physical feature to exaggerate and how. ` +
        `Write a 2-3 sentence image generation prompt describing: the exaggerated feature, the caricature/cartoon illustration style, and any personality-relevant colors or accessories. ` +
        `Output ONLY the image prompt, nothing else.`;

    const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
    const promptResponse = await bedrockClient.send(new ConverseCommand({
        modelId: PROMPT_MODEL_ID,
        messages: [{ role: 'user', content: [{ text: metaPrompt }] }],
        inferenceConfig: { maxTokens: 200, temperature: 0.8 },
    }));
    const imagePrompt = `Caricature portrait illustration: ${promptResponse.output.message.content[0].text.trim()}`;

    // Step 2: Call gpt-image-1 to generate the image.
    // DALL-E models were removed from this account; gpt-image-1 is the
    // current generation. It returns b64_json by default — decoded and
    // uploaded directly to S3 (no intermediate URL download needed).
    const openAiKey = await getOpenAiKey();
    const requestBody = JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
    });

    const imageBytes = await new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.openai.com',
            path: '/v1/images/generations',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Length': Buffer.byteLength(requestBody),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const b64 = JSON.parse(data).data[0].b64_json;
                    resolve(Buffer.from(b64, 'base64'));
                } else {
                    reject(new Error(`OpenAI API error ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(requestBody);
        req.end();
    });

    const bucket = process.env.AVATAR_S3_BUCKET;
    const key = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const s3 = new S3Client({ region: 'us-east-1' });
    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: imageBytes,
        ContentType: 'image/png',
    }));
    return `https://${bucket}.s3.amazonaws.com/${key}`;
}

async function callOpenAIChatCompletions(systemText, messages, openAiKey) {
    const openaiMessages = [
        { role: 'system', content: systemText },
        ...messages.map(m => ({ role: m.role, content: m.content[0].text })),
    ];
    const requestBody = JSON.stringify({
        model: 'gpt-4o-search-preview',
        messages: openaiMessages,
        max_tokens: 120,
    });
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Length': Buffer.byteLength(requestBody),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data).choices[0].message.content);
                } else {
                    reject(new Error(`OpenAI chat API error ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(requestBody);
        req.end();
    });
}

async function handlePersonalitiesEvent(record) {
    const newImage = record.dynamodb && record.dynamodb.NewImage;
    const oldImage = record.dynamodb && record.dynamodb.OldImage;
    if (!newImage) {
        console.log('Personalities event has no NewImage. Ignoring.');
        return 'Successfully processed DynamoDB record';
    }

    const id = ddbStringValue(newImage, 'id');
    const name1 = ddbStringValue(newImage, 'name_1') || 'Bot';
    const name2 = ddbStringValue(newImage, 'name_2') || 'Bot';
    const newP1 = ddbStringValue(newImage, 'personality_1');
    const newP2 = ddbStringValue(newImage, 'personality_2');
    const oldP1 = ddbStringValue(oldImage, 'personality_1');
    const oldP2 = ddbStringValue(oldImage, 'personality_2');

    const p1Changed = newP1 && newP1 !== oldP1;
    const p2Changed = newP2 && newP2 !== oldP2;

    if (!p1Changed && !p2Changed) {
        console.log('No personality text changed (likely echo of our own image write). Skipping.');
        return 'Successfully processed DynamoDB record';
    }

    if (debug) {
        console.log('Personality changes detected', { id, p1Changed, p2Changed });
    }

    const updateInput = { id };

    if (p1Changed) {
        try {
            updateInput.image_1 = await generatePortraitImage(newP1, name1);
        } catch (err) {
            console.log('Image generation failed for slot 1', err);
        }
    }
    if (p2Changed) {
        try {
            updateInput.image_2 = await generatePortraitImage(newP2, name2);
        } catch (err) {
            console.log('Image generation failed for slot 2', err);
        }
    }

    if (Object.keys(updateInput).length === 1) {
        // Only `id` is set — no images succeeded. Nothing to write.
        return 'Successfully processed DynamoDB record';
    }

    try {
        const amplifyClient = configureAmplify();
        await amplifyClient.graphql({
            query: updatePersonalities,
            variables: { input: updateInput },
        });
        if (debug) {
            console.log('Personalities image update written', updateInput);
        }
    } catch (err) {
        console.log('Failed to write Personalities image update', err);
    }

    return 'Successfully processed DynamoDB record';
}

// ─── Chat stream handler (existing behavior) ─────────────────────────────────

async function handleChatEvent(record) {
    /**
     * Initialization section. Quickly return if the result can't be 200.
     */
    const incoming_message = record.dynamodb;
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

    const amplifyClient = configureAmplify();

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

        // Sort descending by updatedAt and take the most recently saved record.
        // The Lambda has IAM bypass of owner filters, so listPersonalities can
        // return multiple records if the user has stale duplicates (e.g. from a
        // create-instead-of-update during the Gen 2 migration). Without this
        // sort, DDB scan order is undefined and an old record can win.
        const items = all_personalities.data.listPersonalities.items;
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        if (items.length > 1) {
            console.log(`Warning: user ${incoming_user_email} has ${items.length} personality records. Using most recently updated (${items[0].id}, updatedAt ${items[0].updatedAt}). Stale IDs: ${items.slice(1).map(p => p.id).join(', ')}`);
        }
        const owner_personality = items[0];

        if (owner_personality) {
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

        const today = new Date().toISOString().split('T')[0];
        const bedrock_converse_system_prompt = [{ text: speaker_personality + `. Today is ${today}. You can use current sports news and player information to back your opinions, but stay in character at all times. React directly to your co-host's last point, then add your own take. Keep your response to 2-3 short sentences — this is live sports radio banter, not a report. Be opinionated and colorful. You are speaking live on radio, not writing — never type URLs, citation markers, bracketed references, or footnotes. No markdown, no bullet points. Do not repeat the prompt. Only one person is speaking.` }];

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

                // Anchor on the original question.
                bedrock_converse_messages.push({
                    role: "user",
                    content: [{ text: chat_messages[0].message.replace(/\n/g, ' ') }]
                });

                // Fold in co-host's most recent message so this bot can react directly.
                // Passing the full alternating history caused gpt-4o-search-preview to echo
                // the co-host verbatim (unlabelled "user" messages + same web search → same text).
                if (chat_messages.length >= 2) {
                    const cohostLatest = chat_messages[chat_messages.length - 1];
                    const cohost = cohostLatest.message.replace(/\n/g, ' ');
                    bedrock_converse_messages[0].content[0].text += ` Co-host ${cohostLatest.speaker_name} just said: "${cohost}"`;
                }
            } catch (error) {
                bedrock_converse_messages.push({
                        role: "user",
                        content: [{ text: last_statement.replace(/\n/g, ' ') }]
                });
                console.log("Warning: unable to retrieve chats. This bot will respond based on the last message, without any additional context. ", error);
            }
        }

        if (debug) {
            console.log("bedrock_converse_messages is", bedrock_converse_messages);
        }

        let message = '';
        if(mock_bedrock) {
            message = "Yo, what's up folks? It's Jim Hoagies here, and I gotta say, that game last night was a freakin' joke. The Ravens? They're a real team, they know how to get the job done. But the Jaguars? They're a bunch of scrubs, they don't belong on the same field as the Ravens. I mean, come on, they got shut out ";
        } else {
            const openAiKey = await getOpenAiKey();
            message = await callOpenAIChatCompletions(
                bedrock_converse_system_prompt[0].text,
                bedrock_converse_messages,
                openAiKey
            );
        }
        if (debug) {
            console.log("Full message body from OpenAI is:", message);
        }
        // Strip inline citation links that gpt-4o-search-preview injects: ([source](url))
        message = message.replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g, '');
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
            console.warn("Warning: empty message returned by OpenAI.");
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
