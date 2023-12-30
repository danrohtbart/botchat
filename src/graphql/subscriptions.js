/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateCast = /* GraphQL */ `
  subscription OnCreateCast(
    $filter: ModelSubscriptionCastFilterInput
    $owner: String
  ) {
    onCreateCast(filter: $filter, owner: $owner) {
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
export const onUpdateCast = /* GraphQL */ `
  subscription OnUpdateCast(
    $filter: ModelSubscriptionCastFilterInput
    $owner: String
  ) {
    onUpdateCast(filter: $filter, owner: $owner) {
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
export const onDeleteCast = /* GraphQL */ `
  subscription OnDeleteCast(
    $filter: ModelSubscriptionCastFilterInput
    $owner: String
  ) {
    onDeleteCast(filter: $filter, owner: $owner) {
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
export const onUpdateBot = /* GraphQL */ `
  subscription OnUpdateBot(
    $filter: ModelSubscriptionBotFilterInput
    $owner: String
  ) {
    onUpdateBot(filter: $filter, owner: $owner) {
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
export const onDeleteBot = /* GraphQL */ `
  subscription OnDeleteBot(
    $filter: ModelSubscriptionBotFilterInput
    $owner: String
  ) {
    onDeleteBot(filter: $filter, owner: $owner) {
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
