/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createPersonalities = /* GraphQL */ `
  mutation CreatePersonalities(
    $input: CreatePersonalitiesInput!
    $condition: ModelPersonalitiesConditionInput
  ) {
    createPersonalities(input: $input, condition: $condition) {
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
export const updatePersonalities = /* GraphQL */ `
  mutation UpdatePersonalities(
    $input: UpdatePersonalitiesInput!
    $condition: ModelPersonalitiesConditionInput
  ) {
    updatePersonalities(input: $input, condition: $condition) {
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
export const deletePersonalities = /* GraphQL */ `
  mutation DeletePersonalities(
    $input: DeletePersonalitiesInput!
    $condition: ModelPersonalitiesConditionInput
  ) {
    deletePersonalities(input: $input, condition: $condition) {
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
export const createChat = /* GraphQL */ `
  mutation CreateChat(
    $input: CreateChatInput!
    $condition: ModelChatConditionInput
  ) {
    createChat(input: $input, condition: $condition) {
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
export const updateChat = /* GraphQL */ `
  mutation UpdateChat(
    $input: UpdateChatInput!
    $condition: ModelChatConditionInput
  ) {
    updateChat(input: $input, condition: $condition) {
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
export const deleteChat = /* GraphQL */ `
  mutation DeleteChat(
    $input: DeleteChatInput!
    $condition: ModelChatConditionInput
  ) {
    deleteChat(input: $input, condition: $condition) {
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
export const createBot = /* GraphQL */ `
  mutation CreateBot(
    $input: CreateBotInput!
    $condition: ModelBotConditionInput
  ) {
    createBot(input: $input, condition: $condition) {
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
export const updateBot = /* GraphQL */ `
  mutation UpdateBot(
    $input: UpdateBotInput!
    $condition: ModelBotConditionInput
  ) {
    updateBot(input: $input, condition: $condition) {
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
export const deleteBot = /* GraphQL */ `
  mutation DeleteBot(
    $input: DeleteBotInput!
    $condition: ModelBotConditionInput
  ) {
    deleteBot(input: $input, condition: $condition) {
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
