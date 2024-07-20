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

export const periodStringToPeriod = (periodString: PeriodString): GamePeriod => {
  if (
    periodString === "daily" ||
    periodString === "biWeekly" ||
    periodString === "weekly" ||
    periodString === "monthly"
  ) {
    return periodString as "daily" | "biWeekly" | "weekly" | "monthly";
  } else if (periodString.startsWith("every")) {
    const [recurrence, dayOfWeek] = periodString.split("-");
    return {
      recurrence: recurrence as "every" | "everyOther",
      dayOfWeek: dayOfWeek as "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday",
    };
  } else {
    const [quantity, unit] = periodString.split("-");
    return {
      quantity: Number(quantity),
      unit: unit as "day" | "week" | "month",
    };
  }
};

export const periodToPeriodString = (period: GamePeriod): PeriodString => {
  if (typeof period === "string") {
    return period;
  } else if ("recurrence" in period) {
    return `${period.recurrence}-${period.dayOfWeek}`;
  } else if ("quantity" in period) {
    return `${period.quantity}-${period.unit}`;
  }
  throw new Error("Invalid period");
};
