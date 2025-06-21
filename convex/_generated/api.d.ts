/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chat_create from "../chat/create.js";
import type * as chat_list from "../chat/list.js";
import type * as chat_messages from "../chat/messages.js";
import type * as chat_send from "../chat/send.js";
import type * as chat from "../chat.js";
import type * as files from "../files.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "chat/create": typeof chat_create;
  "chat/list": typeof chat_list;
  "chat/messages": typeof chat_messages;
  "chat/send": typeof chat_send;
  chat: typeof chat;
  files: typeof files;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
