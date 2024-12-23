import {
  firebaseUserSchema,
  sqlUserSchema,
  TFirebaseUser,
  TSqlUser,
} from "@potw/schemas";
import {eq} from "drizzle-orm";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {getFirestore} from "../firestore/firestore";


export async function fetchTFirebaseUserData(args: {firestoreId: string}): Promise<TFirebaseUser>
export async function fetchTFirebaseUserData(args: {sqlId: string}): Promise<TFirebaseUser>
export async function fetchTFirebaseUserData(args: {firestoreId: string} | {sqlId: string}): Promise<TFirebaseUser> {
  const logger = getLogger();
  logger.info("fetchTFirebaseUserData: begin", {
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
        logger.info("fetchTFirebaseUserData: fetched user data", {
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
        logger.info("fetchTFirebaseUserData: fetched user data", {
          data: docData,
        });
        return firebaseUserSchema.parse(docData);
      });
  }
  throw new Error("Invalid arguments");
}

export async function fetchTSqlUserData(args: {firestoreId: string}): Promise<TSqlUser>
export async function fetchTSqlUserData(args: {sqlId: string}): Promise<TSqlUser>
export async function fetchTSqlUserData(args: {firestoreId: string} | {sqlId: string}): Promise<TSqlUser> {
  const logger = getLogger();
  logger.info("fetchTSqlUserData: begin", {
    args,
  });
  if ("firestoreId" in args) {
    return getDb().query.users.findFirst({
      where: eq(users.firestoreId, args.firestoreId),
    }).then((doc) => {
      if (!doc) {
        throw new Error("User not found");
      }
      logger.info("fetchTSqlUserData: fetched user data", {
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
      logger.info("fetchTSqlUserData: fetched user data", {
        data: doc,
      });
      return sqlUserSchema.parse(doc);
    });
  }
  throw new Error("Invalid arguments");
}
