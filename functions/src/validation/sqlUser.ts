import {z} from "zod";

import {SelectUser} from "../db/schema/user";

import {withDates} from "./shared";

export const sqlUserSchema = z.object({
  sqlId: z.string(),
  email: z.string(),
  firestoreId: z.string(),

  username: z.string().nullable(),
  aboutMe: z.string().nullable(),
  avatarUrl: z.string().nullable(),

}).extend(withDates);

export type SqlUser = z.infer<typeof sqlUserSchema>;

export const userUpdateSchema = sqlUserSchema.pick({
  sqlId: true,
  username: true,
  aboutMe: true,
  avatarUrl: true,
}).partial();

export type UserUpdate = z.infer<typeof userUpdateSchema>;

export function selectUserToSqlUser(selectUser: SelectUser): SqlUser {
  return sqlUserSchema.parse({
    sqlId: selectUser.id,
    email: selectUser.email,
    firestoreId: selectUser.firestoreId,
    username: selectUser.username,
    aboutMe: selectUser.aboutMe,
    avatarUrl: selectUser.avatarUrl,
    createdAt: selectUser.createdAt,
    updatedAt: selectUser.updatedAt,
  });
}
