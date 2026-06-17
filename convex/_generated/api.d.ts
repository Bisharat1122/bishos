/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as ai from "../ai.js";
import type * as aiThreads from "../aiThreads.js";
import type * as auth from "../auth.js";
import type * as checkins from "../checkins.js";
import type * as crons from "../crons.js";
import type * as dailyFlow from "../dailyFlow.js";
import type * as dashboard from "../dashboard.js";
import type * as files from "../files.js";
import type * as focus from "../focus.js";
import type * as goals from "../goals.js";
import type * as habits from "../habits.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as lifeAreas from "../lifeAreas.js";
import type * as momentum from "../momentum.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as openrouter from "../openrouter.js";
import type * as profile from "../profile.js";
import type * as projects from "../projects.js";
import type * as push from "../push.js";
import type * as pushSend from "../pushSend.js";
import type * as range from "../range.js";
import type * as reviews from "../reviews.js";
import type * as schedule from "../schedule.js";
import type * as search from "../search.js";
import type * as sections from "../sections.js";
import type * as seed from "../seed.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  ai: typeof ai;
  aiThreads: typeof aiThreads;
  auth: typeof auth;
  checkins: typeof checkins;
  crons: typeof crons;
  dailyFlow: typeof dailyFlow;
  dashboard: typeof dashboard;
  files: typeof files;
  focus: typeof focus;
  goals: typeof goals;
  habits: typeof habits;
  helpers: typeof helpers;
  http: typeof http;
  lifeAreas: typeof lifeAreas;
  momentum: typeof momentum;
  notes: typeof notes;
  notifications: typeof notifications;
  openrouter: typeof openrouter;
  profile: typeof profile;
  projects: typeof projects;
  push: typeof push;
  pushSend: typeof pushSend;
  range: typeof range;
  reviews: typeof reviews;
  schedule: typeof schedule;
  search: typeof search;
  sections: typeof sections;
  seed: typeof seed;
  tasks: typeof tasks;
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
