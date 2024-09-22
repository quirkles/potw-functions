import {z} from "zod";

export const gameVoteSchema = z.object({
  sqlId: z.string(),
  firestoreId: z.string(),

  gameSqlId: z.string(),
  gameFirestoreId: z.string(),

  gameWeekSqlId: z.string(),
  gameWeekFirestoreId: z.string(),

  userSqlId: z.string(),
  userFirestoreId: z.string(),


  pickSqlId: z.string(),
  pickFirestoreId: z.string(),
});

export type GameVote = z.infer<typeof gameVoteSchema>;
