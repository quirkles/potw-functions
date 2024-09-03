import {z} from "zod";

export const withDates = {
  createdAt: z.string(),
  updatedAt: z.string(),
};
