'use client'
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsmobile from '../aws-exports';
import { withAuthenticator, Button, Menu, Input, ScrollView } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api'; // Needed to import the specific function from aws-amplify
import React, { useRef, useEffect } from "react";
import * as mutations from '../graphql/mutations';
import * as queries from "../graphql/queries";
import * as subscriptions from "../graphql/subscriptions";
import intlFormatDistance from "date-fns/intlFormatDistance";
import { getCurrentUser } from 'aws-amplify/auth';
import {
  PersonalitiesUpdateForm 
 } from '../ui-components';

const debug = false;

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

export function Home({ signOut, user }) {
  const [chats, setChats] = React.useState([]);
  const [personalities, setPersonalities] = React.useState([]);

  // in the future, retrieve the authenticated user's email address into the user_email variable
  let user_email = 'User email not set';

  React.useEffect(() => {
    async function fetchChats() {
      try {
        const { signInDetails } = await getCurrentUser();
        user_email = signInDetails.loginId;
      } catch (err) {
        alert("Could not retrieve your signInDetails. Logging you out.");
        console.log(err);
        signOut();
      }
      if (debug) {
        console.log("Retrieving chats with user email: ", user_email);
      }
      try {
        const allChats = await amplifyClient.graphql({
          query: queries.listChats,
          variables: {
            filter: {
              user_email: { eq: user_email } // this is the authenticated user's email address
            }
          },
          authMode: 'userPool',
        });
        if (debug) {
          console.log("All chats: ", allChats);
        }
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
      query: subscriptions.onCreateChat, 
      authMode: 'userPool',
    }).subscribe({
      next: ({ provider, data }) =>
        setChats((prev) => [...prev, data.onCreateChat]),
      error: (err) => console.log("Error fetching subscriptions: ", err),
    });
    return () => sub.unsubscribe();
  }, []);

  // On load, initialize the personalities variable from GraphQL storage into the personalities React state
  React.useEffect(() => {
    // Create a function that initializes the Personalities object for this owner in the GraphQL database, if it is null. The logic is very similar to CheckBots, but the data is Personalities. 
    async function InitializePersonalities () {
      if (debug) {
        console.log("Beginning to initialize personalities.");
        console.log("User: ", user);
      }

      let graphql_personalities = null;
      let must_initialize_personalities = false;

      // Replicated from FetchChats. Opportunity for future refactoring. 
      try {
        const { signInDetails } = await getCurrentUser();
        user_email = signInDetails.loginId;
      } catch (err) {
        alert("Could not retrieve your signInDetails. Logging you out.");
        console.log(err);
        signOut();
      }
      if (debug) {
        console.log(err);
      }
      try {
        graphql_personalities = await amplifyClient.graphql({
          query: queries.listPersonalities,
          variables: {
            filter: {
              user_email: { eq: user_email } // this is the authenticated user's email address
            }
          },
          authMode: 'userPool',
        });
        if (debug) {
          console.log("Personalities: ", graphql_personalities);
        }

        if (!graphql_personalities) {
          must_initialize_personalities = true;
        } else if (graphql_personalities.data.listPersonalities.items.length == 0) {
          must_initialize_personalities = true;
        } else if (debug) {
          console.log("Number of personalities: ", graphql_personalities.data.listPersonalities.items.length);
        };

        if (debug) {
          console.log("Must initialize personalities: ", must_initialize_personalities);
        }

        if (must_initialize_personalities) {
          const default_personalities = {
            name_1: "Jim",
            personality_1: "You are a sports talk radio host from Philadelphia, named Jim Hoagies. You should respond like a jerk. You have strong opinions, and do not present counter-arguments.",
            name_2: "Mark",
            personality_2: "You are a sports talk radio host from Philadelphia, named Mark Waterice. You are polite, smart, and firm. You have strong opinions, and do not present counter-arguments.",
            user_email: user_email,
          };
          if (debug) {
            console.log("Initializing with default personalities: ", default_personalities);
          }
          
          try {
            await amplifyClient.graphql({
              query: mutations.createPersonalities,
              variables: {
                input: default_personalities,
              },
              authMode: 'userPool'
            });
            console.log("Personalities initialized in database.");
          } catch (error) {
            console.log("Error creating personalities in database: ", error);
          };
        }
      } catch (error) {
        console.log("Error fetching personalities: ", error);
      }

      // Clean up. There must be one-and-only-one Personalities record for this user
      let cleanup_personalities = null;
      let most_recent_personality = null;
      let personality_id_to_delete = null;
      try {
        cleanup_personalities = await amplifyClient.graphql({
          query: queries.listPersonalities,
          variables: {
            filter: {
              user_email: { eq: user_email } // this is the authenticated user's email address
            }
          },
          authMode: 'userPool',
        });
        if (debug) {
          console.log("Number of Personalities records: ", cleanup_personalities.data.listPersonalities.items.length);
          console.log("Personalities: ", cleanup_personalities);
        }
        // iterate through the personalities. personalities might be null. look at the bot_order of each bot.
        for (let i = 0; i < cleanup_personalities.data.listPersonalities.items.length; i++) {
          let cleanup_personality = cleanup_personalities.data.listPersonalities.items[i];
          if (most_recent_personality == null) {
            // If this is the first personality, it is the most recent personality.
            most_recent_personality = cleanup_personality;
          } else if (cleanup_personality.createdAt > most_recent_personality.createdAt) {
            // If this personality is more recent than the most recent personality, it is the most recent personality. Delete the previous most_recent_personality. 
            personality_id_to_delete = most_recent_personality.id;
            most_recent_personality = cleanup_personality;
          } else {
            // If this personality is not more recent than the most recent personality, it is not the most recent personality. Delete it. 
            personality_id_to_delete = cleanup_personality.id;
          }
          if (debug) {
            console.log("Most recent personality: ", most_recent_personality);
            console.log("Personality to delete: ", personality_id_to_delete);
          }
          if (personality_id_to_delete) {
            try {
              await amplifyClient.graphql({
                query: mutations.deletePersonalities,
                variables: {
                  input: {
                    id: personality_id_to_delete,
                  }
                },
                authMode: 'userPool',
              });
              personality_id_to_delete = null;
              console.log("Personalities cleaned up.");
            } catch (error) {
              console.log("Error deleting personalities: ", error);
            }
          }
        }
      } catch (error) {
        console.log("Error cleaning up duplicate personalities: ", error);
      }
      if (debug) {
        console.log("Returning personalities:", most_recent_personality);
      }
      setPersonalities(most_recent_personality); 
    } 
    InitializePersonalities();
  }, [ ]); 

  async function DeleteChats () {
    try {
      for (let c in chats) {
        // delete that chat using the GraphQL API
        await amplifyClient.graphql({
          query: mutations.deleteChat,
          variables: {
            input: {
              id: chats[c].id,
            },
          },
          authMode: 'userPool',
        });
      }
      setChats([]);
    } catch (error) {
      console.log("Error deleting chats: ", error);
    }
  }  
    
  return (/*<Authenticator>{({ signOut, user }) => (*/
    <main className="flex min-h-screen min-w-full flex-col items-center bg-white">
      <div className="flex h-1/8 p-2 w-full flex-row justify-evenly bg-gray-100">
        <Menu>
            <PersonalitiesUpdateForm personalities={personalities}/>
        </Menu>
        <div className="flex h-1/8 w-1/2 items-center">
          <b>Call&nbsp;in:&nbsp;</b>
          <Input
            type="text"
            name="search"
            id="search"
            onKeyUp={async (e) => {
              if (e.key === "Enter") {
                const output = {
                  message: e.target.value,
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
          <Button onClick={signOut}>&nbsp;Sign&nbsp;out</Button>
        </div>
        <div className="h-1/8 flex items-center">
          <Button onClick={DeleteChats}>&nbsp;Delete&nbsp;Chats</Button>
        </div>
      </div>
      <div className="flex h-1/8 w-full flex-row justify-evenly">
        &nbsp;
      </div>
      <ScrollView maxHeight="75%">
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
        &nbsp;<AlwaysScrollToBottom />
      </ScrollView>
    </main>
    /*)}</Authenticator>*/
  )
}
 
// Same function is used in the Lambda function. Opportunity for refactoring. 
async function WriteToGraphQL (amplifyClient, output) {
  try {
    const { signInDetails } = await getCurrentUser();
    output.user_email = signInDetails.loginId;
  } catch (err) {
    alert("Could not retrieve your signInDetails. Logging you out.");
    console.log(err);
    signOut();
  }

  // create a new variable called thread_id which is the concatenation of a datetime in YYYYMMDDZHH:MM:SS format, and a uuid
  const thread_id = new Date().toISOString().replace(/:/g, '-') + '-' + self.crypto.randomUUID();

  output = {
    ...output,
    message_in_thread: 0,
    thread_id: thread_id
  }

  await amplifyClient.graphql({
    query: mutations.createChat,
    variables: {
      input: output,
    },
    authMode: 'userPool',
  });
}

const AlwaysScrollToBottom = () => {
  const elementRef = useRef();
  useEffect(() => elementRef.current.scrollIntoView());
  return <div ref={elementRef} />;
};


export default withAuthenticator(Home);