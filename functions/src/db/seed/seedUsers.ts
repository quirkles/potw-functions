import {faker} from "@faker-js/faker";
import {getFirestore} from "firebase-admin/firestore";

import {users} from "../schema/user";

import {getDb} from "./getDb";

interface ISeedUsersProps {
    count?: number,
}

let firestore: FirebaseFirestore.Firestore;

function initFirestore() {
  firestore = getFirestore();
}

export async function seedUsers({
  count = 100,
}: ISeedUsersProps) {
  const results = [];
  initFirestore();
  let scriptTimedOut = false;
  const timeout = setTimeout(() => {
    scriptTimedOut = true;
  }, 1000 * 60 * 5);
  let remaining = count;
  while (remaining > 0 && !scriptTimedOut) {
    const email = faker.internet.email().toLowerCase();
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
  const existingUsers = await firestore.collection("users").where("email", "==", email).get().then((snapshot) => {
    return snapshot.size;
  });
  if (existingUsers > 0) {
    return null;
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
