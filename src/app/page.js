'use client'
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsmobile from '../aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api'; // Needed to import the specific function from aws-amplify
import React from "react";
import * as mutations from '../graphql/mutations';
import * as queries from "../graphql/queries";
import * as subscriptions from "../graphql/subscriptions";
import intlFormatDistance from "date-fns/intlFormatDistance";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { getCurrentUser } from 'aws-amplify/auth';

Amplify.configure({
  ...awsmobile,
  // this lets you run Amplify code on the server-side in Next.js
  ssr: true
});
const amplifyClient = generateClient();

/* 
Good news! Found a blog post: 
https://dev.to/codebeast/build-a-multi-user-chat-app-with-aws-amplify-3915
but needed this article to get the GraphQL API working
https://docs.amplify.aws/javascript/build-a-backend/graphqlapi/set-up-graphql-api/
*/ 

export default function Home() {
  const [chats, setChats] = React.useState([]);

  React.useEffect(() => {
    async function fetchChats() {
      try {
        const allChats = await amplifyClient.graphql({
          query: queries.listChats,
        });
        setChats(allChats.data.listChats.items);
        } catch (error) {
          console.log("Error fetching chats: ", error);
        }
      }
    fetchChats();
  }, []);

  // Rewrote this section based on https://docs.amplify.aws/javascript/build-a-backend/graphqlapi/subscribe-data/
  React.useEffect(() => {
    const sub = amplifyClient.graphql({
      query: subscriptions.onCreateChat
    }).subscribe({
      next: ({ provider, data }) =>
        setChats((prev) => [...prev, data.onCreateChat]),
      error: (err) => console.log("Error fetching subscriptions: ", err),
    });
    return () => sub.unsubscribe();
  }, []);

  // retrieve the authenticated user's email address into the user_email variable
  // not yet implemented
  const user_email = 'User email not set';
    
  return (<Authenticator>{({ signOut, user }) => (
    <main className="flex min-h-screen max-h-screen flex-col items-center justify-between p-1">
      <div className="flex justify-center items-left h-screen w-3/4 flex-col">
        <div className={`h-3/4 flex flex-col overflow-y-scroll`}>
          {chats
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((chat) => (
              <div
                key={chat.id}
                className={`flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 w-3/4 my-2 ${
                  chat.user_email === user_email && "self-end bg-gray-200"
                }`}
              >
                <div>
                  <div className="flex justify-between gap-x-4">
                    <div className="py-0.5 text-xs leading-5 text-gray-500">
                      <span className="font-medium text-gray-900">
                        {chat.speaker_name}
                      </span>{" "}
                    </div>
                    <time
                      dateTime="2023-01-23T15:56"
                      className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                    >
                      {intlFormatDistance(new Date(chat.createdAt), new Date())}
                    </time>
                  </div>
                  <p className="text-sm leading-6 text-gray-500">{chat.message}</p>
                </div>
              </div>
            ))}
        </div>
        <div className="h-1/8 flex items-center">
          Enter&nbsp;message:&nbsp;  
          <input
            type="text"
            name="search"
            id="search"
            onKeyUp={async (e) => {
              if (e.key === "Enter") {
                const output = {
                  message: e.target.value,
                  message_in_thread: 1,
                  user_email: user_email, 
                  speaker_name: 'Caller',
                };
                WriteToGraphQL (amplifyClient, output);
                WriteToSNS(output);
                e.target.value = "";
              }
            }}
            className="block w-full rounded-md border-0 py-1.5 pr-14 pl-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
          <button onClick={signOut}>&nbsp;Sign&nbsp;out</button>
        </div>
      </div>
    </main>
    )}</Authenticator>
  )
}


// Function named WriteToSNS which takes a string parameter called message, then writes the message to an SNS topic named sports_radio_message_sns.fifo, so the lambda can pick it up and generate a response.
// Same function is used in the Lambda function. Opportunity for refactoring. 
async function WriteToSNS(output) {
  try {
    const { signInDetails } = await getCurrentUser();
    output.user_email = signInDetails.loginId;
  } catch (err) {
    console.log(err);
  }
  
  const client = new SNSClient({
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
  const command = new PublishCommand(input); 
  const response = await client.send(command);
} 
  

// Same function is used in the Lambda function. Opportunity for refactoring. 
async function WriteToGraphQL (amplifyClient, output) {
  try {
    const { signInDetails } = await getCurrentUser();
    output.user_email = signInDetails.loginId;
  } catch (err) {
    console.log(err);
  }

  await amplifyClient.graphql({
    query: mutations.createChat,
    variables: {
      input: output,
    }
  });
}