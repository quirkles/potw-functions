import {z} from "zod";

import {gameSchema} from "./game";
import {gameWeekSchema} from "./gameWeek";
import {pickSchema} from "./pick";
import {userSchema} from "./user";

const userWithRelationsSchema = userSchema.extend({
  gamesAsAdmin: z.array(gameSchema).optional(),
  gamesAsParticipant: z.array(gameSchema).optional(),
  picks: z.array(z.object({})).optional(),
});

export type UserWithRelations = z.infer<typeof userWithRelationsSchema>;

export const gameWithRelationsSchema = gameSchema.extend({
  admin: userSchema.optional(),
  players: z.array(userSchema).optional(),
  gameWeeks: z.array(gameWeekSchema).optional(),
});

export type GameWithRelations = z.infer<typeof gameWithRelationsSchema>;

export const gameWeekWithRelationsSchema = gameWeekSchema.extend({
  picks: z.array(pickSchema).optional(),
  game: gameSchema.optional(),
});

export type GameWeekWithRelations = z.infer<typeof gameWeekWithRelationsSchema>;

export const pickWithRelationsSchema = pickSchema.extend({
  user: userSchema.optional(),
  gameWeek: gameWeekSchema.optional(),
});

export type PickWithRelations = z.infer<typeof pickWithRelationsSchema>;
