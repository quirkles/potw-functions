import {z} from "zod";

export const gameWeekSchema = z.object({
  sqlId: z.string(),
  startDateTime: z.date(),
  theme: z.string().nullable(),
  meetingLink: z.string().nullable(),

  gameSqlId: z.string(),
});

export type GameWeek = z.infer<typeof gameWeekSchema>;
