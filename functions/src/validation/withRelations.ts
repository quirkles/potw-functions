import {z} from "zod";

import {gameWeekSchema} from "./gameWeek";
import {pickSchema} from "./pick";
import {sqlGameSchema} from "./sqlGame";
import {sqlUserSchema} from "./sqlUser";

const userWithRelationsSchema = sqlUserSchema.extend({
  gamesAsAdmin: z.array(sqlGameSchema).optional(),
  gamesAsParticipant: z.array(sqlGameSchema).optional(),
  picks: z.array(z.object({})).optional(),
});

export type UserWithRelations = z.infer<typeof userWithRelationsSchema>;

export const gameWithRelationsSchema = sqlGameSchema.extend({
  admin: sqlUserSchema.optional(),
  players: z.array(sqlUserSchema).optional(),
  gameWeeks: z.array(gameWeekSchema).optional(),
});

export type GameWithRelations = z.infer<typeof gameWithRelationsSchema>;

export const gameWeekWithRelationsSchema = gameWeekSchema.extend({
  picks: z.array(pickSchema).optional(),
  game: sqlGameSchema.optional(),
});

export type GameWeekWithRelations = z.infer<typeof gameWeekWithRelationsSchema>;

export const pickWithRelationsSchema = pickSchema.extend({
  user: sqlUserSchema.optional(),
  gameWeek: gameWeekSchema.optional(),
});

export type PickWithRelations = z.infer<typeof pickWithRelationsSchema>;
