import {
  nextFriday,
  nextMonday, nextSaturday,
  nextSunday,
  nextThursday,
  nextTuesday,
  nextWednesday,
  parse,
} from "date-fns";
import {add} from "date-fns/add";
import {z} from "zod";

import {periodStringToPeriod} from "../app/games/transforms";
import {getLogger} from "../functionWrapper";
import {Period, PeriodString} from "../validation/game";

export const timeStringRegex = /^([01][0-9]|2[0123]):[0-5][0-9]:00$/;
export const timeStringSchema = z.string().regex(timeStringRegex);
export type TimeString = z.infer<typeof timeStringSchema>;

type Year =
    | "2024"
    | "2025"
    | "2026"
    | "2027"
    | "2028"
    | "2029"
    | "2030"
    | "2031"
    | "2032"
    | "2033"
    | "2034"
    | "2035";
type Month =
    | "01"
    | "02"
    | "03"
    | "04"
    | "05"
    | "06"
    | "07"
    | "08"
    | "09"
    | "10"
    | "11"
    | "12";
type Day =
    | "01"
    | "02"
    | "03"
    | "04"
    | "05"
    | "06"
    | "07"
    | "08"
    | "09"
    | "10"
    | "11"
    | "12"
    | "13"
    | "14"
    | "15"
    | "16"
    | "17"
    | "18"
    | "19"
    | "20"
    | "21"
    | "22"
    | "23"
    | "24"
    | "25"
    | "26"
    | "27"
    | "28"
    | "29"
    | "30"
    | "31";
export type DateString = `${Year}-${Month}-${Day}`;

export function isDateString(date: string): date is DateString {
  return /^2\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date);
}

export function stringAsDateString(dateStr?: string | null): DateString | null {
  if (!dateStr) {
    return null;
  }
  if (!isDateString(dateStr)) {
    throw new Error("Invalid date string passed to toDateString: " + dateStr);
  }
  return dateStr;
}

export const calculateNextGameWeekStartDate = (
  game: {
      startDate: string;
      period: PeriodString;
      regularScheduledStartTimeUtc: TimeString;
    },
  latestGameWeekStartDate: Date | null,
): Date => {
  const logger = getLogger();
  const {startDate, period, regularScheduledStartTimeUtc} = game;

  logger.info("calculateNextGameWeekStartDate: begin", {
    startDate,
    period,
    regularScheduledStartTimeUtc,
    latestGameWeekStartDate,
  });

  // We add 2 days to the latest game week start date to get the threshold date
  // They might have moved the start time back by a few hours or even a day, long weekend etc

  const dateString = stringAsDateString(startDate);

  if (!dateString) {
    throw new Error("Invalid date string passed to calculateNextGameWeekStartDate");
  }

  let gameStartDate: Date;

  gameStartDate = parse(
    `${dateString}T${regularScheduledStartTimeUtc}+00`,
    "yyyy-MM-dd'T'HH:mm:ssx",
    new Date(),
  );

  logger.info("calculateNextGameWeekStartDate: initial game start date", {
    gameStartDate,
  });

  while (gameStartDate <= (latestGameWeekStartDate || new Date())) {
    gameStartDate = incrementDateToNextPeriod(gameStartDate, periodStringToPeriod(period));
  }
  return gameStartDate;
};

function incrementDateToNextPeriod(date: Date, period: Period): Date {
  if (typeof period === "string") {
    switch (period) {
    case "daily":
      return add(date, {days: 1});
    case "biWeekly":
      return add(date, {weeks: 2});
    case "weekly":
      return add(date, {weeks: 1});
    case "monthly":
      return add(date, {months: 1});
    }
  }
  if ("quantity" in period) {
    switch (period.unit) {
    case "day":
      return add(date, {days: period.quantity});
    case "week":
      return add(date, {weeks: period.quantity});
    case "month":
      return add(date, {months: period.quantity});
    }
  }
  if ("recurrence" in period) {
    const addWeek = period.recurrence === "everyOther" ? 1 : 0;
    switch (period.dayOfWeek) {
    case "sunday":
      return add(nextSunday(date), {weeks: addWeek});
    case "monday":
      return add(nextMonday(date), {weeks: addWeek});
    case "tuesday":
      return add(nextTuesday(date), {weeks: addWeek});
    case "wednesday":
      return add(nextWednesday(date), {weeks: addWeek});
    case "thursday":
      return add(nextThursday(date), {weeks: addWeek});
    case "friday":
      return add(nextFriday(date), {weeks: addWeek});
    case "saturday":
      return add(nextSaturday(date), {weeks: addWeek});
    }
  }
  throw new Error("Invalid period passed to incrementDateToNextPeriod");
}
