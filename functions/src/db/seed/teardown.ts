import path from "node:path";

import {configDotenv} from "dotenv";
import {notInArray} from "drizzle-orm/sql/expressions/conditions";


import {games} from "../schema/game";
import {users} from "../schema/user";

import {documentsToPreserve} from "./config";
import {firestore} from "./firestore";
import {getDb} from "./getDb";

const [env = "local"] = process.argv.slice(2);

const configPath = path.join(__dirname, "../../../", `.env.${env}`);

console.log(`Looking for config at ${configPath}`);

configDotenv({
  path: configPath,
});

const db = getDb();

export async function teardown() {
  const batch = firestore.batch();
  const collections = await firestore.listCollections();
  if (!collections) {
    console.log("No collections found");
    return;
  }
  for (const collection of collections) {
    const query = await collection.get();
    for (const doc of query.docs) {
      const subCollections = await doc.ref.listCollections();
      if (subCollections) {
        for (const subcollection of subCollections) {
          const subquery = await subcollection.get();
          for (const subdoc of subquery.docs) {
            batch.delete(subdoc.ref);
          }
        }
      }
      if (documentsToPreserve.firebase[collection.id]?.includes(doc.id)) {
        console.log(`Preserving ${collection.id}/${doc.id}`);
        continue;
      }
      batch.delete(doc.ref);
    }
  }
  await batch.commit();
  await db.delete(users).where(
    notInArray(users.id, documentsToPreserve.postgres.users),
  );
  await db.delete(games);
}

teardown().then(() => {
  console.log("Teardown completed successfully");
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
