import {getLogger} from "../../functionWrapper";
import {isNotEmpty} from "../../utils/logic";
import {User, userSchema} from "../../validation/user";
import {inviteOrGetId} from "../firestore/user";
import {saveOrCreate} from "../sql/user";

export async function inviteUsers(emails: string[], invitor: string): Promise<User[]> {
  const logger = getLogger();
  logger.info("inviteUsers: begin", {
    emails: emails,
  });
  return Promise.all(
    emails.map((email) =>
      inviteOrGetId(email, invitor)
        .then((firestoreId) => saveOrCreate({email, firestoreId})
          .then((user) => userSchema.parse(user))
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

