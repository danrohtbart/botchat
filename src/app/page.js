'use client'
import Image from 'next/image'
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import { ThemeProvider } from '@aws-amplify/ui-react';
import React from "react";
import * as mutations from '../graphql/mutations';
import { generateClient } from 'aws-amplify/api';


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
    
  return (<Authenticator><ThemeProvider>
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
    <div className="flex justify-center items-center h-screen w-full">
          <div className={`w-3/4 flex flex-col`}>
            {chats}
            <div>
              <div className="relative mt-2 flex items-center">
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
                            email: 'dan@rohtbart.com', /*obviously fix this in the future*/
                          },
                        },
                      });
                      e.target.value = "";
                    }
                  }}
                  className="block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                  <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-xs text-gray-400">
                    Enter
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">src/app/page.js</code>
        </p>
      </div>
    </main>
    </ThemeProvider></Authenticator>
  )
}
