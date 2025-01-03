import {sqlUserSchema, TSqlUser} from "@potw/schemas";

import {getLogger} from "../../functionWrapper";
import {isNotEmpty} from "../../utils/logic";
import {inviteOrGetId} from "../firestore/user";
import {saveOrCreate} from "../sql/user";

export async function inviteUsers(emails: string[], invitor: string): Promise<TSqlUser[]> {
  const logger = getLogger();
  logger.info("inviteUsers: begin", {
    emails: emails,
  });
  return Promise.all(
    emails.map((email) =>
      inviteOrGetId(email, invitor)
        .then((firestoreId) => saveOrCreate({email, firestoreId})
          .then((user) => sqlUserSchema.parse(user))
        ).catch((error) => {
          logger.error("inviteUsers: Error inviting user", {
            email,
            err: error,
          });
          return null;
        })
    )
  ).then((usersOrNull) => {
    logger.info("inviteUsers: end", {
      usersInvited: usersOrNull || [],
    });
    return usersOrNull.filter(isNotEmpty);
  });
}

