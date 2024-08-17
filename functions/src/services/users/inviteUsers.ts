import {getLogger} from "../../functionWrapper";
import {inviteOrGetId} from "../firestore/user";
import {saveOrCreate} from "../sql/user";
import {isNotEmpty} from "../../utils/logic";

export async function inviteUsers(emails: string[], invitor: string): Promise<{
    email: string,
    firestoreId: string,
    sqlId: string,
}[]> {
  const logger = getLogger();
  logger.info("inviteUsers: begin", {
    emails: emails,
  });
  return Promise.all(
    emails.map((email) =>
      inviteOrGetId(email, invitor)
        .then((firestoreId) => saveOrCreate({email, firestoreId})
          .then((user) => ({email, firestoreId, sqlId: user.id}))
        ).catch((error) => {
          logger.error("inviteUsers: Error inviting user", {
            email,
            err: error,
          });
          return null;
        })
    )
  ).then((usersOrNull) => usersOrNull.filter(isNotEmpty));
}

