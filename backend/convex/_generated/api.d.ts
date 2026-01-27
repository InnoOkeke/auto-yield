/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as app from "../app.js";
import type * as blockchain_actions from "../blockchain_actions.js";
import type * as crons from "../crons.js";
import type * as lib_avantis from "../lib/avantis.js";
import type * as lib_blockchain from "../lib/blockchain.js";
import type * as lib_deduction from "../lib/deduction.js";
import type * as lib_notification from "../lib/notification.js";
import type * as stats from "../stats.js";
import type * as subscriptions from "../subscriptions.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  app: typeof app;
  blockchain_actions: typeof blockchain_actions;
  crons: typeof crons;
  "lib/avantis": typeof lib_avantis;
  "lib/blockchain": typeof lib_blockchain;
  "lib/deduction": typeof lib_deduction;
  "lib/notification": typeof lib_notification;
  stats: typeof stats;
  subscriptions: typeof subscriptions;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
