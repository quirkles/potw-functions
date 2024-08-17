import {SelectUser, users} from "../../db/schema/user";
import {getDb} from "../../db/dbClient";
import {getLogger} from "../../functionWrapper";

export async function saveOrCreate(user: {
  email: string,
  firestoreId: string,
}): Promise<SelectUser> {
  const logger = getLogger();
  logger.info("saveOrCreate: begin", {
    user,
  });
  const {
    email,
    firestoreId,
  } = user;
  const db = getDb();
  const result = await db.insert(users).values({
    email,
    firestoreId,
  }).onConflictDoNothing()
    .returning({
      id: users.id,
      email: users.email,
      firestoreId: users.firestoreId,
    })
    .catch((error) => {
      logger.error("saveOrCreate: Error saving user", {
        user,
        err: error,
      });
      return [];
    });
  logger.info("saveOrCreate: result", {
    result,
  });
  if (result.length === 0) {
    logger.info("saveOrCreate: no result");
    throw new Error("Failed to retrieve id");
  }
  if (result.length > 1) {
    logger.error("saveOrCreate: multiple results");
    throw new Error("Multiple results found");
  }
  return Promise.resolve({
    id: result[0].id,
    email,
    firestoreId,
    username: email,
  });
}
