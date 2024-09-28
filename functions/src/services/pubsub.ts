import {PubSub} from "@google-cloud/pubsub";

import {getLogger} from "../functionWrapper";
import keyMirror from "../utils/object";

export const TopicNames = keyMirror([
  "SEND_EMAIL",
  "DAILY_GAME_UPDATE",
] as const);

export type TopicNames = keyof typeof TopicNames;

const ACTIONS = keyMirror([
  "SEND_CLOSE_GAME_WEEK_REMINDER",
  "DAILY_GAME_UPDATE",
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
  }) => ({
    ...payload,
    action: "DAILY_GAME_UPDATE",
    topic: TopicNames.DAILY_GAME_UPDATE,
  }),
} satisfies {
    [key in ACTIONS]: (payload: any) => {
      action: key;
      topic: TopicNames
    } & Record<string, string | number>;
};

export function dispatchPubSubEvent(action: ReturnType<typeof payloadCreators[ACTIONS]>) {
  const logger = getLogger();
  logger.info("Dispatching event", {action});
  const pubsub = new PubSub();
  const {topic: topicName, ...payloadObj} = action;
  const topic = pubsub.topic(topicName);
  return topic.publishMessage({
    json: payloadObj,
  });
}
