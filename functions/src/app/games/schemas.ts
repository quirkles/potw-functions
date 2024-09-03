import {z} from "zod";

import {timeStringSchema} from "../../utils/dates";
import {periodSchema} from "../../validation/game";


export const createGamePayloadSchema = z.object({
  name: z.string(),
  description: z.string().or(z.null()),
  isPrivate: z.boolean(),
  adminId: z.string(),
  startDate: z.string(),
  endDate: z.string().or(z.null()),
  addAdminAsPlayer: z.boolean(),
  regularScheduledStartTimeUtc: timeStringSchema,
  period: periodSchema,
  players: z.array(z.object({
    email: z.string(),
    firestoreId: z.string().or(z.null()),
  })),
});
export type CreateGamePayload = z.infer<typeof createGamePayloadSchema>;

