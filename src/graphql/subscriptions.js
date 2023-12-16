/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateChat = /* GraphQL */ `
  subscription OnCreateChat(
    $filter: ModelSubscriptionChatFilterInput
    $owner: String
  ) {
    onCreateChat(filter: $filter, owner: $owner) {
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
export const onUpdateChat = /* GraphQL */ `
  subscription OnUpdateChat(
    $filter: ModelSubscriptionChatFilterInput
    $owner: String
  ) {
    onUpdateChat(filter: $filter, owner: $owner) {
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
export const onDeleteChat = /* GraphQL */ `
  subscription OnDeleteChat(
    $filter: ModelSubscriptionChatFilterInput
    $owner: String
  ) {
    onDeleteChat(filter: $filter, owner: $owner) {
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
