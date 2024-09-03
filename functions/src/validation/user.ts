import {z} from "zod";

import {gameSchema} from "./game";
import {withDates} from "./shared";

export const userSchema = z.object({
  sqlId: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  firestoreId: z.string(),
  gamesAsAdmin: z.array(gameSchema).optional(),
  gamesAsParticipant: z.array(gameSchema).optional(),
  picks: z.array(z.object({})).optional(),
}).extend(withDates);

export type User = z.infer<typeof userSchema>;
