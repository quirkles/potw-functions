import path from "node:path";

import {PubSub} from "@google-cloud/pubsub";
import {configDotenv} from "dotenv";

const pathToLocalEnv = path.join(__dirname, "../../.env.local");

console.log(`Looking for config at ${pathToLocalEnv}`);

configDotenv({
  path: pathToLocalEnv,
});

import {TopicNames} from "../services/pubsub";


async function main() {
  const pubsub = new PubSub({
    projectId: process.env.PUBSUB_PROJECT_ID,
  });
  for (const topicName of Object.values(TopicNames)) {
    console.log(`Creating topic: ${topicName}`);
    await pubsub.createTopic(topicName).catch((err) => {
      console.error(`Failed to create topic: ${topicName}`);
      console.error(err);
    }).then(() => {
      console.log(`Created topic: ${topicName}`);
    });
  }
}

main()
  .then(() => console.log("Local setup complete"))
  .catch(console.error);
