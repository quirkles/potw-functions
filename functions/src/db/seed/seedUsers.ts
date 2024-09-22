import {faker} from "@faker-js/faker";

import {users} from "../schema/user";

import {firestore} from "./firestore";
import {getDb} from "./getDb";

interface ISeedUsersProps {
    count?: number,
}

const ensureEmailsIncluded: string[] = [
  // "al.quirk@gmail.com",
];

export async function seedUsers({
  count = 100,
}: ISeedUsersProps) {
  const results = [];
  let scriptTimedOut = false;
  const timeout = setTimeout(() => {
    scriptTimedOut = true;
  }, 1000 * 60 * 5);
  let remaining = Math.max(count, ensureEmailsIncluded.length);
  while (remaining > 0 && !scriptTimedOut) {
    console.log(`Creating user ${remaining} of ${count}`);
    const email = ensureEmailsIncluded.pop() || faker.internet.email().toLowerCase();
    const firestoreId = await createFirebaseUser({
      email,
    });
    if (firestoreId === null) {
      continue;
    }
    const sqlId = await createSqlUser({
      email, firestoreId,
    });
    if (!sqlId) {
      continue;
    }
    await setSqlIdOnFirestoreUser({
      sqlId, firestoreId,
    });
    results.push({
      firestoreId,
      sqlId,
    });
    remaining--;
  }
  clearTimeout(timeout);
  return results;
}

async function createFirebaseUser({
  email,
}: {
  email: string
}): Promise<null | string> {
  const existingUsers = await firestore.collection("users").where("email", "==", email).limit(1).get();
  if (existingUsers.docs.length > 0) {
    // return existing user
    return existingUsers.docs[0].id;
  }
  // Create a new user
  const newUser = firestore.collection("users").doc();
  await newUser.set({
    email,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return newUser.id;
}

async function createSqlUser({
  firestoreId,
  email,
}: {
  firestoreId: string
  email: string
}): Promise<null | string> {
  const db = getDb();
  const [inserted] = await db.insert(users).values({
    email,
    firestoreId,
    username: email,
  }).returning({
    insertedId: users.id,
  }).onConflictDoUpdate({
    target: users.firestoreId,
    set: {
      email,
    },
  });

  return inserted.insertedId;
}

async function setSqlIdOnFirestoreUser({
  sqlId,
  firestoreId,
}: {
  sqlId: string,
  firestoreId: string
}): Promise<void> {
  await firestore.collection("users").doc(firestoreId).set({
    sqlId,
  }, {
    merge: true,
  });
}
