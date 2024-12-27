import {TSqlUser} from "@potw/schemas";

import {SelectUser} from "../../db/schema/user";

export function selectUserToReturnUser(user: SelectUser): TSqlUser {
  return {
    sqlId: user.id,
    firestoreId: user.firestoreId,
    email: user.email,
    username: user.username || null,
    avatarUrl: user.avatarUrl || null,
    aboutMe: user.aboutMe || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
