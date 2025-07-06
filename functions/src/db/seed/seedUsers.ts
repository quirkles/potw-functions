import {faker} from "@faker-js/faker";
import {DocumentReference} from "@google-cloud/firestore";

import {users} from "../schema/user";

import {firestore} from "./firestore";
import {getDb} from "./getDb";

interface ISeedUsersProps {
    count?: number,
}


export async function seedUsers({
  count = 100,
}: ISeedUsersProps): Promise<string[]> {
  const db = getDb();
  const firestoreUserDocs: DocumentReference[] = [];
  let remaining = count;
  const sqlInsertResults = await db.transaction(async (transaction) => {
    const results: {
        sqlId: string,
        firestoreId: string,
        email: string
    }[] = [];

    while (remaining > 0) {
      const email = faker.internet.email().toLowerCase();
      const firestoreUser = firestore.collection("users").doc();
      firestoreUserDocs.push(firestoreUser);
      transaction.insert(users).values({
        email,
        firestoreId: firestoreUser.id,
        username: email.split("@")[0],
      }).onConflictDoUpdate({
        target: users.firestoreId,
        set: {
          email,
        },
      }).returning({
        sqlId: users.id,
        firestoreId: users.firestoreId,
        email: users.email,
      }).then((result) => {
        results.push(...result);
      });
      remaining--;
    }
    return results;
  });

  const firestoreIdToTSqlUser: {
    [firestoreId: string]: {
        sqlId: string,
        email: string
    }
  } = sqlInsertResults.reduce((acc: {
    [firestoreId: string]: {
        sqlId: string,
        email: string
    }
  }, result) => {
    acc[result.firestoreId] = {
      sqlId: result.sqlId,
      email: result.email,
    };
    return acc;
  }, {});
  const batch = firestore.batch();
  console.log(`Seeding ${firestoreUserDocs.length} users into Firestore...`);
  for (const ref of firestoreUserDocs) {
    batch.set(ref, {
      sqlId: firestoreIdToTSqlUser[ref.id].sqlId,
      email: firestoreIdToTSqlUser[ref.id].email,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await batch.commit();
  return sqlInsertResults.map((result) => result.sqlId);
}
