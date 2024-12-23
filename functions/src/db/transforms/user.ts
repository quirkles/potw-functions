import {sqlUserSchema, TSqlUser} from "@potw/schemas";

import {SelectUser} from "../schema/user";

export function selectUserToSqlUser(selectUser: SelectUser): TSqlUser {
  return sqlUserSchema.parse({
    sqlId: selectUser.id,
    firestoreId: selectUser.firestoreId,

    email: selectUser.email,
    username: selectUser.username,
    aboutMe: selectUser.aboutMe,
    avatarUrl: selectUser.avatarUrl,

    createdAt: selectUser.createdAt,
    updatedAt: selectUser.updatedAt,
  });
}
