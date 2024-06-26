import {onRequest} from "firebase-functions/v2/https";
import {eq} from "drizzle-orm";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";

export const fetchUserById = onRequest(
  async (req, res) => {
    const {
      id
      , includeGames = "",
    } = req.query;
    if (!id) {
      res.status(400).send("id is required");
      return;
    }
    const shouldIncludeGames = includeGames === "true";
    const db = getDb();
    const result = await db.query.users.findFirst({
      where: eq(users.id, String(id)),
      with: {
        gamesAsParticipant: shouldIncludeGames as true,
        gamesAsAdmin: shouldIncludeGames as true,
      },
    });
    if (!result) {
      res.status(404).send("user not found");
      return;
    }
    (result as Record<string, unknown>)["sqlId"] = result.id;
    res.status(200).json(result);
    return;
  });
