/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getCast = /* GraphQL */ `
  query GetCast($id: ID!) {
    getCast(id: $id) {
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
  }
`;
export const listCasts = /* GraphQL */ `
  query ListCasts(
    $filter: ModelCastFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCasts(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
export const getChat = /* GraphQL */ `
  query GetChat($id: ID!) {
    getChat(id: $id) {
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
