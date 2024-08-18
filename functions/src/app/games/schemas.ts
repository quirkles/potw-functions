import {z} from "zod";

export const periodSchema = z.union([
  z.enum(["daily", "biWeekly", "weekly", "monthly"]),
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

export type GamePeriod = z.infer<typeof periodSchema>;

export const createGamePayloadSchema = z.object({
  name: z.string(),
  description: z.string().or(z.null()),
  isPrivate: z.boolean(),
  adminId: z.string(),
  startDate: z.string(),
  endDate: z.string().or(z.null()),
  addAdminAsPlayer: z.boolean(),
  period: periodSchema,
  players: z.array(z.object({
    email: z.string(),
    firestoreId: z.string().or(z.null()),
  })),
});
export type CreateGamePayload = z.infer<typeof createGamePayloadSchema>;

export const gameSchema = createGamePayloadSchema.omit({
  adminId: true,
  addAdminAsPlayer: true,
}).extend({
  id: z.string(),
  admin: z.object({
    sqlId: z.string(),
    email: z.string(),
    firestoreId: z.string(),
    username: z.string().nullable(),
  }),
  players: z.array(z.object({
    email: z.string(),
    firestoreId: z.string().or(z.null()),
    sqlId: z.string().or(z.null()),
    username: z.string().nullable(),
  })),
});
export type Game = z.infer<typeof gameSchema>;

export const periodStringSchema = z.union([
  z.enum([
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
  ]),
  z.string().regex(/^[0-9]+-(day|week|month)$/),
]);

export type PeriodString = z.infer<typeof periodStringSchema>;
