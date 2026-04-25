/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getPersonalities = /* GraphQL */ `
  query GetPersonalities($id: ID!) {
    getPersonalities(id: $id) {
      id
      name_1
      personality_1
      name_2
      personality_2
      image_1
      image_2
      user_email
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listPersonalities = /* GraphQL */ `
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
        image_1
        image_2
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
export const getChat = /* GraphQL */ `
  query GetChat($id: ID!) {
    getChat(id: $id) {
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
export const listChats = /* GraphQL */ `
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
export const getBot = /* GraphQL */ `
  query GetBot($id: ID!) {
    getBot(id: $id) {
      id
      bot_order
      bot_name
      bot_personality
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listBots = /* GraphQL */ `
  query ListBots(
    $filter: ModelBotFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listBots(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        bot_order
        bot_name
        bot_personality
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
