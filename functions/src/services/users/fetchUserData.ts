import {eq} from "drizzle-orm";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {FirebaseUser, firebaseUserSchema} from "../../validation/firebaseUser";
import {SqlUser, sqlUserSchema} from "../../validation/sqlUser";
import {getFirestore} from "../firestore/firestore";


export async function fetchFirebaseUserData(args: {firestoreId: string}): Promise<FirebaseUser>
export async function fetchFirebaseUserData(args: {sqlId: string}): Promise<FirebaseUser>
export async function fetchFirebaseUserData(args: {firestoreId: string} | {sqlId: string}): Promise<FirebaseUser> {
  const logger = getLogger();
  logger.info("fetchFirebaseUserData: begin", {
    args,
  });
  if ("firestoreId" in args) {
    return getFirestore()
      .collection("users")
      .doc(args.firestoreId)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          throw new Error("User not found");
        }
        const docData = doc.data();
        logger.info("fetchFirebaseUserData: fetched user data", {
          data: docData,
        });
        return firebaseUserSchema.parse(docData);
      });
  }
  if ("sqlId" in args) {
    return getFirestore()
      .collection("users")
      .where("sqlId", "==", args.sqlId)
      .get()
      .then((doc) => {
        if (doc.empty) {
          throw new Error("User not found");
        }
        if (doc.size > 1) {
          throw new Error("Multiple users found");
        }
        const docData = doc.docs[0].data();
        logger.info("fetchFirebaseUserData: fetched user data", {
          data: docData,
        });
        return firebaseUserSchema.parse(docData);
      });
  }
  throw new Error("Invalid arguments");
}

export async function fetchSqlUserData(args: {firestoreId: string}): Promise<SqlUser>
export async function fetchSqlUserData(args: {sqlId: string}): Promise<SqlUser>
export async function fetchSqlUserData(args: {firestoreId: string} | {sqlId: string}): Promise<SqlUser> {
  const logger = getLogger();
  logger.info("fetchSqlUserData: begin", {
    args,
  });
  if ("firestoreId" in args) {
    return getDb().query.users.findFirst({
      where: eq(users.firestoreId, args.firestoreId),
    }).then((doc) => {
      if (!doc) {
        throw new Error("User not found");
      }
      logger.info("fetchSqlUserData: fetched user data", {
        data: doc,
      });
      const {id, ...rest} = doc;
      return sqlUserSchema.parse({
        sqlId: id,
        ...rest,
      });
    });
  }
  if ("sqlId" in args) {
    return getDb().query.users.findFirst({
      where: eq(users.id, args.sqlId),
    }).then((doc) => {
      if (!doc) {
        throw new Error("User not found");
      }
      logger.info("fetchSqlUserData: fetched user data", {
        data: doc,
      });
      return sqlUserSchema.parse(doc);
    });
  }
  throw new Error("Invalid arguments");
}
