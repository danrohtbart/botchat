/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createHeadline = /* GraphQL */ `
  mutation CreateHeadline(
    $input: CreateHeadlineInput!
    $condition: ModelHeadlineConditionInput
  ) {
    createHeadline(input: $input, condition: $condition) {
      id
      message
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateHeadline = /* GraphQL */ `
  mutation UpdateHeadline(
    $input: UpdateHeadlineInput!
    $condition: ModelHeadlineConditionInput
  ) {
    updateHeadline(input: $input, condition: $condition) {
      id
      message
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteHeadline = /* GraphQL */ `
  mutation DeleteHeadline(
    $input: DeleteHeadlineInput!
    $condition: ModelHeadlineConditionInput
  ) {
    deleteHeadline(input: $input, condition: $condition) {
      id
      message
      createdAt
      updatedAt
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
export const updateBot = /* GraphQL */ `
  mutation UpdateBot(
    $input: UpdateBotInput!
    $condition: ModelBotConditionInput
  ) {
    updateBot(input: $input, condition: $condition) {
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
export const deleteBot = /* GraphQL */ `
  mutation DeleteBot(
    $input: DeleteBotInput!
    $condition: ModelBotConditionInput
  ) {
    deleteBot(input: $input, condition: $condition) {
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
