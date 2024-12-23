import {SelectUser} from "../../db/schema/user";
import {TSqlUser} from "../../validation/sqlUser";

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
