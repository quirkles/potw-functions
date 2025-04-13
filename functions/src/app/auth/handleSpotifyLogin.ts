import {sign} from "jsonwebtoken";
import {v4} from "uuid";
import {z} from "zod";

import {getConfig} from "../../config";
import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {createLogger} from "../../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../../services/firebase";
import {saveOrGetId, setField} from "../../services/firestore/user";

export const handleSpotifyLogin = httpHandler(
  async function handleSpotifyLogin({body, headers, query}) {
    initializeAppAdmin();

    const logger = createLogger({
      name: "handleSpotifyLogin",
      labels: {
        functionExecutionId: v4(),
        correlationId: headers["x-correlation-id"] as string || v4(),
      },
    });

    logger.info("handleSPotifyLogin: begin", {body, query});

    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: "Bearer " + body.token,
      },
    });

    const data = await response.json();

    logger.info("from spotify", {data});

    const firestoreId = await saveOrGetId(data.email);
    const db = getDb();

    const saved = await db.insert(users).values({
      email: data.email,
      firestoreId,
    }).returning({insertedId: users.id}).onConflictDoUpdate({
      target: users.email,
      set: {
        email: data.email,
      },
    });

    const sqlId = saved[0].insertedId;

    logger.info("saved", {firestoreId, sqlId});

    await setField(firestoreId, "sqlId", sqlId);

    const token = sign({
      email: data.email,
      firestoreId,
      sqlId,
    }, getConfig().jwtSecret);

    logger.info("handleSpotifyLogin: end", {token});

    return {
      response: {
        token,
      },
    };
  }, {
    bodySchema: z.object({
      token: z.string(),
    }),
    responseSchema: z.object({
      token: z.string(),
    }),
    functionName: "handleSpotifyLogin",
  });
