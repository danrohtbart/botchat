import json
import boto3

debug = True

if (debug):
    print('Loading botchatgeneratechat.')

personalities = {
    "Jim": "[INST]You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments. Do not repeat the prompt.[/INST]\n\n", 
    "Mark": "[INST]You are a sports talk radio host from Philadelphia, named Mark Waterice. You are polite, smart, and firm. You have strong opinions, and do not present counter-arguments. Do not repeat the prompt.[/INST]\n\n"
}


def handler(event, context):
    if (debug):
        print('Handling sports_radio_host.')

    if (debug): 
        print("Event = " + json.dumps(event)) 
        for k, v in event.items():
            print("Debug-Event: " + str(k) + " " + str(v) + "\n")

    incoming_message = event['message']
    if (debug):
        print ("Message " + str(incoming_message))

    try:
        last_speaker = incoming_message['MessageAttributes']['speaker']['Value']
    except: 
        last_speaker = ''
        
    try:
        last_statement = incoming_message['Message']
    except: 
        last_statement = ''

    try: 
        message_in_thread = int(incoming_message['MessageAttributes']['message_in_thread']['Value'])
    except:
        message_in_thread = 0
        
    if (debug): 
        print("last_speaker = " + last_speaker)
        print("last_statement = " + last_statement)
        print("message_in_thread = " + str(message_in_thread))
        
    if (message_in_thread > 3):
        print ("Stopping the conversation after " + str(message_in_thread) + " statements.")
        return 0
    else: 
        # Flip the speaker
        if (last_speaker == "Jim"):
            speaker = "Mark"
        else: 
            speaker = "Jim"
        
        instruction = personalities[speaker]

        if(debug): 
            print("instruction = " + instruction)
        
        # prompt the model with the instruction and include the last_statement for context
        prompt = instruction + last_statement + " Respond to that opinion."
        bedrock_request_body = {
            "prompt": prompt,
            "temperature": 0.9,
            "top_p": 0.1,
            "max_gen_len": 255,
        }

        # Requires a recent (12/2023) boto3 library, which I provided in a Lambda Layer
        bedrock_runtime_client = boto3.client('bedrock-runtime') 

        if(debug): 
            print("Invoking Bedrock with bedrock_request_body: " + str(bedrock_request_body))

        statement = ""
        attempt = 1

        # Bedrock kept coming back with empty generation after a few quick calls. Adding this retry.         
        while (statement == "" and attempt <= 5): 
            # might need to pause here if attempt > 1
            attempt += 1
            bedrock_response = bedrock_runtime_client.invoke_model(modelId='meta.llama2-70b-chat-v1', body=json.dumps(bedrock_request_body))
            bedrock_response_body = json.loads(bedrock_response.get('body').read())
            statement = str(bedrock_response_body['generation'])
            if(debug): 
                print("Debug-bedrock_response: " + str(bedrock_response_body))
                print("Debug-generation: " + str(bedrock_response_body['generation']))
                print("Debug-statement: " + statement)

        if (statement == ""):
            statement = "I'm speechless. "

        # send the new statement to SNS
        output_message_attributes = {
            'speaker': {
              'DataType': 'String', 
              'StringValue': speaker
            },
            'message_in_thread': {
              'DataType': 'Number',
              'StringValue': str(message_in_thread + 1)
            }
          }

        if (debug):
            print("Debug-statement: " + str(statement))
            for k, v in output_message_attributes.items():
                print("Debug-output_message_attributes: " + str(k) + " " + str(v) + "\n")

        sns_client = boto3.client('sns')
        response = sns_client.publish(TopicArn='arn:aws:sns:us-east-1:253178317163:sports_radio_message_sns.fifo', Message=statement, MessageAttributes=output_message_attributes, MessageGroupId='0')
        print (speaker + ": " + statement)

        # Send the new statement to the Amplify data store
        write_message_to_amplify(statement, message_in_thread+1)

        return 0


# Function which takes a parameter called message, and writes the message to this Amplify project's data
def write_message_to_amplify(message, message_in_thread):
    if (debug):
        print('Writing message to Amplify.')

    # Create a new Amplify client
    amplify_client = boto3.client('amplify')

    # Create the input data as a dictionary
    input_data = {
    'text': message,
    'email': 'dan@rohtbart.com', 
    'message_in_thread': message_in_thread
    }

    # Create the variables dictionary 
    variables = {
    'input': input_data
    }

    # Make the GraphQL request
    response = amplify_client.graphql(
    query=mutations.createChat,
    variables=variables
    )