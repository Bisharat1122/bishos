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
import type * as aiCapture from "../aiCapture.js";
import type * as aiContent from "../aiContent.js";
import type * as aiKallaway from "../aiKallaway.js";
import type * as aiLearning from "../aiLearning.js";
import type * as aiRouting from "../aiRouting.js";
import type * as aiStrategy from "../aiStrategy.js";
import type * as aiThreads from "../aiThreads.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as campaigns from "../campaigns.js";
import type * as challengeDays from "../challengeDays.js";
import type * as challengeSections from "../challengeSections.js";
import type * as challenges from "../challenges.js";
import type * as checkins from "../checkins.js";
import type * as commitments from "../commitments.js";
import type * as compass from "../compass.js";
import type * as content from "../content.js";
import type * as contentSystem from "../contentSystem.js";
import type * as crons from "../crons.js";
import type * as cycles from "../cycles.js";
import type * as dailyFlow from "../dailyFlow.js";
import type * as dashboard from "../dashboard.js";
import type * as days from "../days.js";
import type * as deals from "../deals.js";
import type * as decisions from "../decisions.js";
import type * as delegation from "../delegation.js";
import type * as exportData from "../exportData.js";
import type * as files from "../files.js";
import type * as finance from "../finance.js";
import type * as focus from "../focus.js";
import type * as founder from "../founder.js";
import type * as game from "../game.js";
import type * as goals from "../goals.js";
import type * as habits from "../habits.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as idealWeek from "../idealWeek.js";
import type * as inbox from "../inbox.js";
import type * as insights from "../insights.js";
import type * as learning from "../learning.js";
import type * as lifeAreas from "../lifeAreas.js";
import type * as momentum from "../momentum.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as offers from "../offers.js";
import type * as onboarding from "../onboarding.js";
import type * as openrouter from "../openrouter.js";
import type * as os from "../os.js";
import type * as people from "../people.js";
import type * as periodicReviews from "../periodicReviews.js";
import type * as profile from "../profile.js";
import type * as projects from "../projects.js";
import type * as push from "../push.js";
import type * as pushSend from "../pushSend.js";
import type * as range from "../range.js";
import type * as recall from "../recall.js";
import type * as resources from "../resources.js";
import type * as reviews from "../reviews.js";
import type * as routines from "../routines.js";
import type * as schedule from "../schedule.js";
import type * as scorecard from "../scorecard.js";
import type * as search from "../search.js";
import type * as sections from "../sections.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as swipes from "../swipes.js";
import type * as tactics from "../tactics.js";
import type * as tasks from "../tasks.js";
import type * as today from "../today.js";
import type * as weekPlans from "../weekPlans.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  ai: typeof ai;
  aiCapture: typeof aiCapture;
  aiContent: typeof aiContent;
  aiKallaway: typeof aiKallaway;
  aiLearning: typeof aiLearning;
  aiRouting: typeof aiRouting;
  aiStrategy: typeof aiStrategy;
  aiThreads: typeof aiThreads;
  analytics: typeof analytics;
  auth: typeof auth;
  campaigns: typeof campaigns;
  challengeDays: typeof challengeDays;
  challengeSections: typeof challengeSections;
  challenges: typeof challenges;
  checkins: typeof checkins;
  commitments: typeof commitments;
  compass: typeof compass;
  content: typeof content;
  contentSystem: typeof contentSystem;
  crons: typeof crons;
  cycles: typeof cycles;
  dailyFlow: typeof dailyFlow;
  dashboard: typeof dashboard;
  days: typeof days;
  deals: typeof deals;
  decisions: typeof decisions;
  delegation: typeof delegation;
  exportData: typeof exportData;
  files: typeof files;
  finance: typeof finance;
  focus: typeof focus;
  founder: typeof founder;
  game: typeof game;
  goals: typeof goals;
  habits: typeof habits;
  helpers: typeof helpers;
  http: typeof http;
  idealWeek: typeof idealWeek;
  inbox: typeof inbox;
  insights: typeof insights;
  learning: typeof learning;
  lifeAreas: typeof lifeAreas;
  momentum: typeof momentum;
  notes: typeof notes;
  notifications: typeof notifications;
  offers: typeof offers;
  onboarding: typeof onboarding;
  openrouter: typeof openrouter;
  os: typeof os;
  people: typeof people;
  periodicReviews: typeof periodicReviews;
  profile: typeof profile;
  projects: typeof projects;
  push: typeof push;
  pushSend: typeof pushSend;
  range: typeof range;
  recall: typeof recall;
  resources: typeof resources;
  reviews: typeof reviews;
  routines: typeof routines;
  schedule: typeof schedule;
  scorecard: typeof scorecard;
  search: typeof search;
  sections: typeof sections;
  seed: typeof seed;
  settings: typeof settings;
  swipes: typeof swipes;
  tactics: typeof tactics;
  tasks: typeof tasks;
  today: typeof today;
  weekPlans: typeof weekPlans;
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
