import {onMessagePublished} from "firebase-functions/v2/pubsub";
import {z} from "zod";
import {User} from "../db/entities/User";
import {getDataSource} from "../db/DBClient";

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
  const dataSource = getDataSource();
  console.log("initializing data source.");
  try {
    await dataSource.initialize();
  } catch (e) {
    console.error(`Error initializing data source: ${e}`);
    return;
  }
  console.log("Done initializing data source");
  const user = dataSource.getRepository(User).create(validated);
  console.log(`saving user: ${JSON.stringify(user)}`);
  try {
    await dataSource.getRepository(User).save(user);
  } catch (e) {
    console.error(`Error saving user: ${e}`);
    return dataSource.destroy();
  }
  console.log(`Saved created: ${JSON.stringify(user)}`);
  return dataSource.destroy();
});
