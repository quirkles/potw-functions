import {onMessagePublished} from "firebase-functions/v2/pubsub";
import {z} from "zod";
import {getDb} from "../db/dbClient";
import {users} from "../db/schema/user";

const userPayloadSchema = z.object({
  firestoreId: z.string(),
  email: z.string(),
  username: z.string().optional(),
});

type UserPayload = z.infer<typeof userPayloadSchema>;

export const createUser = onMessagePublished("create-user", async (event) => {
  console.log(`Received message: ${JSON.stringify(event.data.message.json)}`);
  let validated: UserPayload;
  try {
    validated = userPayloadSchema.parse(event.data.message.json);
  } catch (e) {
    console.error(`Error validating user payload: ${e}`);
    return;
  }
  const db = getDb();
  await db.insert(users).values(validated);
  console.log("inserted", validated);
});
