/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getHeadline = /* GraphQL */ `
  query GetHeadline($id: ID!) {
    getHeadline(id: $id) {
      id
      message
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listHeadlines = /* GraphQL */ `
  query ListHeadlines(
    $filter: ModelHeadlineFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listHeadlines(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        message
        createdAt
        updatedAt
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
      bot_name
      bot_personality
      bot_url
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
        bot_name
        bot_personality
        bot_url
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
