import {z} from "zod";

import {gameSchema} from "./game";
import {withDates} from "./shared";

export const userSchema = z.object({
  sqlId: z.string(),
  email: z.string(),
  firestoreId: z.string(),

  username: z.string().nullable(),
  aboutMe: z.string().nullable(),
  avatarUrl: z.string().nullable(),

  gamesAsAdmin: z.array(gameSchema).optional(),
  gamesAsParticipant: z.array(gameSchema).optional(),
  picks: z.array(z.object({})).optional(),
}).extend(withDates);

export type User = z.infer<typeof userSchema>;

export const userUpdateSchema = userSchema.pick({
  sqlId: true,
  username: true,
  aboutMe: true,
  avatarUrl: true,
}).partial();

export type UserUpdate = z.infer<typeof userUpdateSchema>;
