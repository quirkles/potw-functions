import {z} from "zod";

export const withDates = {
  createdAt: z.string(),
  updatedAt: z.string(),
};

const timestampToDate = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
}).transform((val) => {
  return new Date(val.seconds * 1000);
});

export const withTimestampDates = {
  createdAt: timestampToDate,
  updatedAt: timestampToDate,
};
