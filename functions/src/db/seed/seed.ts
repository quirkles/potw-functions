import * as path from "node:path";
import {configDotenv} from "dotenv";

import * as admin from "firebase-admin";

import {seedUsers} from "./seedUsers";

async function main() {
  admin.initializeApp();
  const [env = "local", count = "1000"] = process.argv.slice(2);

  const seedCount = parseInt(count, 10);

  if (isNaN(seedCount)) {
    throw new Error(`Invalid count: ${count}`);
  }

  if (env !== "local" && env !== "dev") {
    throw new Error(`Invalid env: ${env}`);
  }

  const configPath = path.join(__dirname, "../../../", `.env.${env}`);

  console.log(`Looking for config at ${configPath}`);

  configDotenv({
    path: configPath,
  });

  const users = await seedUsers({
    count: seedCount,
  });

  console.log("Users seeded.");
  console.log(JSON.stringify(users, null, 2));
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
