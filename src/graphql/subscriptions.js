/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateHeadline = /* GraphQL */ `
  subscription OnCreateHeadline($filter: ModelSubscriptionHeadlineFilterInput) {
    onCreateHeadline(filter: $filter) {
      id
      message
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateHeadline = /* GraphQL */ `
  subscription OnUpdateHeadline($filter: ModelSubscriptionHeadlineFilterInput) {
    onUpdateHeadline(filter: $filter) {
      id
      message
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteHeadline = /* GraphQL */ `
  subscription OnDeleteHeadline($filter: ModelSubscriptionHeadlineFilterInput) {
    onDeleteHeadline(filter: $filter) {
      id
      message
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateBot = /* GraphQL */ `
  subscription OnCreateBot(
    $filter: ModelSubscriptionBotFilterInput
    $owner: String
  ) {
    onCreateBot(filter: $filter, owner: $owner) {
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
export const onUpdateBot = /* GraphQL */ `
  subscription OnUpdateBot(
    $filter: ModelSubscriptionBotFilterInput
    $owner: String
  ) {
    onUpdateBot(filter: $filter, owner: $owner) {
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
export const onDeleteBot = /* GraphQL */ `
  subscription OnDeleteBot(
    $filter: ModelSubscriptionBotFilterInput
    $owner: String
  ) {
    onDeleteBot(filter: $filter, owner: $owner) {
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
