import {z} from "zod";

export const gameWeekSqlSchema = z.object({
  sqlId: z.string(),
  firestoreId: z.string(),

  startDateTime: z.date(),
  theme: z.string().nullable(),
  meetingLink: z.string().nullable(),

  gameSqlId: z.string(),
  status: z.enum(["complete", "overdue", "pending", "current"]),
});

export type SqlGameWeek = z.infer<typeof gameWeekSqlSchema>;
