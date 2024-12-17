import {z} from "zod";

export const firebaseGameWeekSchema = z.object({
  gameFirestoreId: z.string(),
  gameSqlId: z.string(),
  sqlId: z.string(),
  theme: z.string().optional(),
  themePoll: z.object(
    {
      options: z.record(z.string(), z.object({
        votes: z.array(z.string()),
      })).optional(),
      status: z.enum(["open", "closed"]),
    }).optional(),
});

export type FirebaseGameWeek = z.infer<typeof firebaseGameWeekSchema>;

