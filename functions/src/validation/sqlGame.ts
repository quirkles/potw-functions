import {z} from "zod";

import {SelectGame} from "../db/schema/game";

import {withDates} from "./shared";
import {withIds} from "./withIds";

export const periodSchema = z.union([
  z.literal("daily"),
  z.literal("biWeekly"),
  z.literal("weekly"),
  z.literal("monthly"),
  z.object({
    quantity: z.number(),
    unit: z.union([z.literal("day"), z.literal("week"), z.literal("month")]),
  }),
  z.object({
    recurrence: z.union([z.literal("every"), z.literal("everyOther")]),
    dayOfWeek: z.union([
      z.literal("sunday"),
      z.literal("monday"),
      z.literal("tuesday"),
      z.literal("wednesday"),
      z.literal("thursday"),
      z.literal("friday"),
      z.literal("saturday"),
    ]),
  }),
]);

export type Period = z.infer<typeof periodSchema>;

export const allPeriodStrings = [
  "daily",
  "biWeekly",
  "weekly",
  "monthly",
  "every-sunday",
  "every-monday",
  "every-tuesday",
  "every-wednesday",
  "every-thursday",
  "every-friday",
  "every-saturday",
  "everyOther-sunday",
  "everyOther-monday",
  "everyOther-tuesday",
  "everyOther-wednesday",
  "everyOther-thursday",
  "everyOther-friday",
  "everyOther-saturday",
] as const;
export const periodStringSchema = z.union([
  z.enum(allPeriodStrings),
  z.string().regex(/^[0-9]+-(day|week|month)$/),
]);

export type PeriodString = z.infer<typeof periodStringSchema>;

export const sqlGameSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  regularScheduledStartTimeUtc: z.string(),
  period: periodStringSchema,
  isPrivate: z.boolean(),

  adminSqlId: z.string(),
})
  .extend(withDates).extend(withIds);

export type SqlGame = z.infer<typeof sqlGameSchema>;


export function selectGameToSqlGame(selectGame: SelectGame): SqlGame {
  return sqlGameSchema.parse({
    sqlId: selectGame.id,
    firestoreId: selectGame.firestoreId,

    name: selectGame.name,
    description: selectGame.description,
    startDate: selectGame.startDate,
    endDate: selectGame.endDate,
    regularScheduledStartTimeUtc: selectGame.regularScheduledStartTimeUtc,
    period: selectGame.period,
    isPrivate: selectGame.isPrivate,
    adminSqlId: selectGame.adminId,

    createdAt: selectGame.createdAt,
    updatedAt: selectGame.updatedAt,
  });
}