import * as path from "node:path";

import {configDotenv} from "dotenv";

import {documentsToPreserve} from "./config";
import {seedGames} from "./seedGames";
import {seedUsers} from "./seedUsers";

const USERS_COUNT = 100;

async function main() {
  const env = (process.env.ENV || "local").toLowerCase();

  const configPath = path.join(__dirname, "../../../", `.env.${env}`);

  console.log(`Looking for config at ${configPath}`);

  configDotenv({
    path: configPath,
  });

  const userSqlIds = await seedUsers({
    count: USERS_COUNT,
  });

  console.log("Users seeded.");

  await seedGames({
    userIds: userSqlIds as [string, ...string[]],
    ensureIncludedUserIds: documentsToPreserve.postgres.users as [string, ...string[]],
  });

  console.log("Games seeded.");
}

main()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
