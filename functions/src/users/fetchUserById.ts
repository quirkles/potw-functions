import {onRequest} from "firebase-functions/v2/https";
import {getDb} from "../db/dbClient";
import {eq} from "drizzle-orm";
import {users} from "../db/schema/user";

export const fetchUserById = onRequest(
  async (req, res) => {
    const {id} = req.query;
    if (!id) {
      res.status(400).send("id is required");
      return;
    }
    const db = getDb();
    const [result] = await db.select({
      sqlId: users.id,
      firestoreId: users.firestoreId,
      username: users.username,
      email: users.email,
    })
      .from(users)
      .where(eq(users.id, String(id)))
      .limit(1);
    console.log("\n####\n", "results", result, "\n####\n");
    if (!result) {
      res.status(404).send("user not found");
      return;
    }
    res.status(200).json(result);
    return;
  });
