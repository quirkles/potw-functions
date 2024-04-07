import {onRequest} from "firebase-functions/v2/https";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games} from "../../db/schema/game";
import {users} from "../../db/schema/user";
import {gamesToUsers} from "../../db/schema/games_to_users";


const createGamePayloadSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  isPrivate: z.boolean(),
  adminId: z.string(),
  includeAdminAsPlayer: z.boolean().optional(),
});
export const createGame = onRequest(async (req, res) => {
  const db = getDb();
  const validated = createGamePayloadSchema.parse(req.body);
  let newGameId;
  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(games).values({
      name: validated.name,
      description: validated.description,
      isPrivate: validated.isPrivate,
      adminId: validated.adminId,
    }).returning({insertedId: users.id});
    newGameId = inserted.insertedId;
    if (validated.includeAdminAsPlayer) {
      await tx.insert(gamesToUsers).values({
        gameId: newGameId,
        userId: validated.adminId,
      });
    }
  });
  res.status(201).send({
    id: newGameId,
    ...validated,
  });
});
