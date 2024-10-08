import {z} from "zod";

export const payloadSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const responseSchema = z.object({
  message: z.string(),
});
