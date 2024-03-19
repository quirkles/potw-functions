import {onRequest} from "firebase-functions/v2/https";
import {getDb} from "../db/dbClient";
import {z} from "zod";
import {games} from "../db/schema/game";
import {users} from "../db/schema/user";

const createGamePayloadSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  isPrivate: z.boolean(),
  adminId: z.string(),
});
export const createGame = onRequest(async (req, res) => {
  const db = getDb();
  const validated = createGamePayloadSchema.parse(req.body);
  const [inserted] = await db.insert(games).values({
    name: validated.name,
    description: validated.description,
    isPrivate: validated.isPrivate,
    adminId: validated.adminId,
  }).returning({insertedId: users.id});
  res.status(201).send({
    id: inserted.insertedId,
    ...validated,
  });
});
