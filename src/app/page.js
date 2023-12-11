'use client'
import Image from 'next/image'
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import { ThemeProvider } from '@aws-amplify/ui-react';
import React from "react";
import * as mutations from '../graphql/mutations';
import { generateClient } from 'aws-amplify/api'; // Needed to import the specific function from aws-amplify
import * as queries from "../graphql/queries";
import intlFormatDistance from "date-fns/intlFormatDistance";
import * as subscriptions from "../graphql/subscriptions";

Amplify.configure({
  ...awsconfig,
  // this lets you run Amplify code on the server-side in Next.js
  ssr: true
});
const client = generateClient();

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
      const allChats = await client.graphql({
        query: queries.listChats,
      });
      console.log(allChats.data.listChats.items);
      setChats(allChats.data.listChats.items);
    }
    fetchChats();
  }, []);

  // Rewrote this section based on https://docs.amplify.aws/javascript/build-a-backend/graphqlapi/subscribe-data/
  React.useEffect(() => {
    const sub = client.graphql({
      query: subscriptions.onCreateChat
    }).subscribe({
      next: ({ provider, data }) =>
        setChats((prev) => [...prev, data.onCreateChat]),
      error: (err) => console.log(err),
    });
    return () => sub.unsubscribe();
  }, []);

    
  return (<Authenticator>
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex justify-center items-center h-screen w-full">
        <div className={`w-3/4 flex flex-col`}>
          {chats
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((chat) => (
              <div
                key={chat.id}
                className={`flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 w-3/4 my-2 ${
                  chat.email === 'User' && "self-end bg-gray-200"
                }`}
              >
                <div>
                  <div className="flex justify-between gap-x-4">
                    <div className="py-0.5 text-xs leading-5 text-gray-500">
                      <span className="font-medium text-gray-900">
                        {chat.email.split("@")[0]}
                      </span>{" "}
                    </div>
                    <time
                      dateTime="2023-01-23T15:56"
                      className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                    >
                      {intlFormatDistance(new Date(chat.createdAt), new Date())}
                    </time>
                  </div>
                  <p className="text-sm leading-6 text-gray-500">{chat.text}</p>
                </div>
              </div>
            ))}
            <div>
              <div className="relative mt-2 flex items-center">
                Enter&nbsp;message:  
                <input
                  type="text"
                  name="search"
                  id="search"
                  onKeyUp={async (e) => {
                    if (e.key === "Enter") {
                      await client.graphql({
                        query: mutations.createChat,
                        variables: {
                          input: {
                            text: e.target.value,
                            email: 'User', /*obviously fix this in the future*/
                          },
                        },
                      });
                      console.log(e.target.value)
                      e.target.value = "";
                    }
                  }}
                  className="block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
    </main>
    </Authenticator>
  )
}
