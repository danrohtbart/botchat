import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";





type EagerChat = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Chat, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly message: string;
  readonly message_in_thread?: number | null;
  readonly user_email?: string | null;
  readonly speaker_name?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyChat = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Chat, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly message: string;
  readonly message_in_thread?: number | null;
  readonly user_email?: string | null;
  readonly speaker_name?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Chat = LazyLoading extends LazyLoadingDisabled ? EagerChat : LazyChat

export declare const Chat: (new (init: ModelInit<Chat>) => Chat) & {
  copyOf(source: Chat, mutator: (draft: MutableModel<Chat>) => MutableModel<Chat> | void): Chat;
}

type EagerBot = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Bot, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly bot_order: number;
  readonly bot_name?: string | null;
  readonly bot_personality?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyBot = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Bot, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly bot_order: number;
  readonly bot_name?: string | null;
  readonly bot_personality?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Bot = LazyLoading extends LazyLoadingDisabled ? EagerBot : LazyBot

export declare const Bot: (new (init: ModelInit<Bot>) => Bot) & {
  copyOf(source: Bot, mutator: (draft: MutableModel<Bot>) => MutableModel<Bot> | void): Bot;
}