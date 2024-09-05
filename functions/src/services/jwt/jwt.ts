import {verify} from "jsonwebtoken";
import {z} from "zod";

import {getConfig} from "../../config";

const tokenBodySchema = z.object({
  email: z.string(),
  firestoreId: z.string(),
  sqlId: z.string(),
});

export type TokenBody = z.infer<typeof tokenBodySchema>;

export function verifyToken(token: string): TokenBody {
  const tokenInfo = verify(token, getConfig().jwtSecret);
  return tokenBodySchema.parse(tokenInfo);
}
