import {GamePeriod, PeriodString} from "./schemas";


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
