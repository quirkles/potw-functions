import {z} from "zod";

export const withIds = {
  sqlId: z.string(),
  firestoreId: z.string(),
};
