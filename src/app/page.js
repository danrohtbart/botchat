'use client'
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsmobile from '../aws-exports';
import { Authenticator, Divider } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api'; // Needed to import the specific function from aws-amplify
import React, { useRef, useEffect } from "react";
import * as mutations from '../graphql/mutations';
import * as queries from "../graphql/queries";
import * as subscriptions from "../graphql/subscriptions";
import intlFormatDistance from "date-fns/intlFormatDistance";
import { getCurrentUser } from 'aws-amplify/auth';

const debug = true;

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

  // UseEffect hook that checks whether the user has Bot 1 and Bot 2. If either is missing, it creates the bot with the default personalities. 
  React.useEffect(() => {
    checkBots();
  }, [ ]); 

  // retrieve the authenticated user's email address into the user_email variable
  let user_email = 'User email not set';
    
  return (<Authenticator hideSignUp={true} >{({ signOut, user }) => (
    <main className="flex min-h-screen flex-col items-center justify-between p-1 bg-white">
      <div className="flex justify-center items-left h-screen w-5/6 flex-col">
        <div className={`h-3/4 flex flex-col overflow-y-scroll`}>
          {chats
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((chat) => (
              <div
                key={chat.id}
                className={`flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 w-3/4 my-2 ${
                  chat.user_email === user_email && "self-end bg-blue-600" || "bg-slate-200"
                }`}
              >
                <div className="text-gray-500">
                  <div className="flex justify-between gap-x-4">
                    <div className="py-0.5 text-xs leading-5">
                      <span className={`font-medium ${chat.user_email === user_email && "text-slate-50"}`}>
                        {chat.speaker_name}
                      </span>{" "}
                    </div>
                    <time
                      dateTime="2023-01-23T15:56"
                      className={`flex-none py-0.5 text-xs leading-5 ${chat.user_email === user_email && "text-slate-50"}`}
                    >
                      {intlFormatDistance(new Date(chat.createdAt), new Date())}
                    </time>
                  </div>
                  <p className={`text-sm leading-6 ${chat.user_email === user_email && "text-slate-50"}`}>{chat.message}</p>
                </div>
              </div>
          ))}
          <AlwaysScrollToBottom />
        </div>
        <div className="h-1/8 flex items-center">
          Call&nbsp;in:&nbsp;  
          <input
            type="text"
            name="search"
            id="search"
            onKeyUp={async (e) => {
              if (e.key === "Enter") {
                const output = {
                  message: e.target.value,
                  message_in_thread: 0,
                  user_email: user_email, 
                  speaker_name: 'Caller',
                };
                WriteToGraphQL (amplifyClient, output);
                e.target.value = "";
              }
            }}
            className="block w-full rounded-md border-0 py-1.5 pr-14 pl-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
        <div className="h-1/8 flex items-center">
          <Divider orientation="horizontal" />
        </div>
        <div className="h-1/8 flex items-center">
          <button onClick={signOut}>&nbsp;Sign&nbsp;out</button>
        </div>
      </div>
    </main>
    )}</Authenticator>
  )
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

const AlwaysScrollToBottom = () => {
  const elementRef = useRef();
  useEffect(() => elementRef.current.scrollIntoView());
  return <div ref={elementRef} />;
};

async function checkBots() {
  if (debug) {
    console.log("Checking whether the user's bots need initializing.");
  }

  let bots = null; 
  let bot1 = false;
  let bot2 = false;
  
  try {
    bots = await amplifyClient.graphql({
      query: queries.listBots,
    });
    if (debug) {
      console.log("Bots: ", bots);
    }
    // iterate through the bots. bots might be null. look at the bot_order of each bot. 
    for (let i = 0; i < bots.data.listBots.items.length; i++) {
      let bot = bots.data.listBots.items[i];
      if (bot.bot_order == 1) {
        bot1 = true;
      } else if (bot.bot_order == 2) {
        bot2 = true;
      }
    }

    if (debug) {
      console.log("Bot 1: ", bot1);
      console.log("Bot 2: ", bot2);
    }

    if (!bot1) {
      try {
        await amplifyClient.graphql({
          query: mutations.createBot,
          variables: {
            input: {
              bot_order: 1,
              bot_name: "Jim",
              bot_personality: "You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments.",
            }
          }
        });
        console.log("Bot 1 initialized.");
      } catch (error) {
        console.log("Error creating bot1: ", error);
      }
    }
    if (!bot2) {
      try {
        await amplifyClient.graphql({
          query: mutations.createBot,
          variables: {
            input: {
              bot_order: 2,
              bot_name: "Mark",
              bot_personality: "You are a sports talk radio host from Philadelphia, named Mark Waterice. You are polite, smart, and firm. You have strong opinions, and do not present counter-arguments.",
            }
          }
        });
        console.log("Bot 2 initialized.");
      } catch (error) {
        console.log("Error creating bot2: ", error);
      }
    }
    // Clean up
    let bot = null
    let best_bot1 = null;
    let best_bot2 = null;
    bots = await amplifyClient.graphql({
      query: queries.listBots,
    });
    if (debug) {
      console.log("Clean up bots: ", bots);
    }
    // iterate through the bots. bots might be null. look at the bot_order of each bot. 
    for (let i = 0; i < bots.data.listBots.items.length; i++) {
      if (debug) {
        console.log("i: ", i);
        console.log("Bot: ", bots.data.listBots.items[i]);
      }
      bot = bots.data.listBots.items[i];

      if (bot) {
        if (bot.bot_order == 1) {
          if (!best_bot1) {
            if (debug) {
              console.log("There was no best_bot1. Setting best_bot1 to bot: ", bot);
            }
            best_bot1 = bot;
          } else {
            // delete the bot with the oldest updatedAt
            if (bot.updatedAt < best_bot1.updatedAt) {
              await amplifyClient.graphql({
                query: mutations.deleteBot,
                variables: {
                  input: {
                    id: bot.id,
                  }
                }
              });
            } else {
              await amplifyClient.graphql({
                query: mutations.deleteBot,
                variables: {
                  input: {
                    id: best_bot1.id,
                  }
                }
              });
              best_bot1 = bot;
            }
          }
        } else if (bot.bot_order == 2) {
          if (!best_bot2) {
            if (debug) {
              console.log("There was no best_bot2. Setting best_bot2 to bot: ", bot);
            }
            best_bot2 = bot;
          } else {
            // delete the bot with the oldest updatedAt
            if (bot.updatedAt < best_bot2.updatedAt) {
              await amplifyClient.graphql({
                query: mutations.deleteBot,
                variables: {
                  input: {
                    id: bot.id,
                  }
                }
              });
            } else {
              await amplifyClient.graphql({
                query: mutations.deleteBot,
                variables: {
                  input: {
                    id: best_bot2.id,
                  }
                }
              });
              best_bot2 = bot;
            }
          }
        }
      }
    }

  } catch (error) {
    console.log("Error fetching bots: ", error);
  } 
};