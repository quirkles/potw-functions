import {PubSub} from "@google-cloud/pubsub";

import {getConfig} from "../config";
import {getLogger} from "../functionWrapper";
import keyMirror from "../utils/object";

export const TopicNames = keyMirror([
  "SEND_EMAIL",
  "DAILY_GAME_UPDATE",
  "CREATE_USER",
] as const);

export type TopicNames = keyof typeof TopicNames;

const ACTIONS = keyMirror([
  "SEND_CLOSE_GAME_WEEK_REMINDER",
  "DAILY_GAME_UPDATE",
  "CREATE_USER",
] as const);

type ACTIONS = keyof typeof ACTIONS;


export const payloadCreators = {
  SEND_CLOSE_GAME_WEEK_REMINDER: (payload: {
    gameWeekId: string;
    adminId: string;
  }) => ({
    ...payload,
    action: "SEND_CLOSE_GAME_WEEK_REMINDER",
    topic: TopicNames.SEND_EMAIL,
  }),
  DAILY_GAME_UPDATE: (payload: {
    gameSqlId: string;
    gameFirestoreId: string;
  }[]) => ({
    ...payload,
    action: "DAILY_GAME_UPDATE",
    topic: TopicNames.DAILY_GAME_UPDATE,
  }),
  CREATE_USER: (payload: {
        firestoreId: string;
        email: string;
        username?: string;
    }) => ({
    ...payload,
    action: "CREATE_USER",
    topic: TopicNames.CREATE_USER,
  }),
} satisfies {
    [key in ACTIONS]: (...args: never[]) => {
      action: key;
      topic: TopicNames
    } & Record<string, unknown>;
};

export function dispatchPubSubEvent(action: ReturnType<typeof payloadCreators[ACTIONS]>) {
  const logger = getLogger();
  logger.info("Dispatching event", {action});
  const pubsubConfig = getConfig().env === "local" ? {
    apiEndpoint: `localhost:${process.env.PUBSUB_EMULATOR_PORT}`,
  }: {};
  logger.info("Pubsub config", {pubsubConfig});
  const pubsub = new PubSub(pubsubConfig);
  const {topic: topicName, ...payloadObj} = action;
  const topic = pubsub.topic(topicName);
  return topic.publishMessage({
    json: payloadObj,
  }).then((messageId) => {
    logger.info("Event dispatched", {messageId});
  }).catch((err) => {
    logger.error("Error dispatching event", {err});
  });
}
