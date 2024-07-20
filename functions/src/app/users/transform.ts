import {z} from "zod";
import {SelectUser} from "../../db/schema/user";

const returnUserSchema = z.object({
  sqlId: z.string(),
  firestoreId: z.string(),
  email: z.string(),
  username: z.string().or(z.null()),
});

export type ReturnUser = z.infer<typeof returnUserSchema>;

export function selectUserToReturnUser(user: SelectUser): ReturnUser {
  return {
    sqlId: user.id,
    firestoreId: user.firestoreId,
    email: user.email,
    username: user.username || null,
  };
}
