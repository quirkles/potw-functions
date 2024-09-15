import {z} from "zod";

import {withDates} from "./shared";

export const pickSchema = z.object({
  sqlId: z.string(),
  spotifyTrackId: z.string().nullable(),
  youtubeVideoId: z.string().nullable(),
  youtubeTrackId: z.string().nullable(),
  artist: z.string(),
  title: z.string(),

  userSqlId: z.string(),
  gameWeekSqlId: z.string(),
}).extend(withDates);

export type Pick = z.infer<typeof pickSchema>;
