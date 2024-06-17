import {onRequest} from "firebase-functions/v2/https";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {games} from "../../db/schema/game";
import {users} from "../../db/schema/user";
import {gamesToUsers} from "../../db/schema/games_to_users";
import {eq} from "drizzle-orm";


const periodSchema = z.union([
  z.literal("daily"),
  z.literal("biWeekly"),
  z.literal("weekly"),
  z.literal("monthly"),
  z.object({
    quantity: z.number(),
    unit: z.union([z.literal("day"), z.literal("week"), z.literal("month")]),
  }),
  z.object({
    recurrence: z.union([z.literal("every"), z.literal("everyOther")]),
    dayOfWeek: z.union([
      z.literal("sunday"),
      z.literal("monday"),
      z.literal("tuesday"),
      z.literal("wednesday"),
      z.literal("thursday"),
      z.literal("friday"),
      z.literal("saturday"),
    ]),
  }),
]);

export const createGamePayloadSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  isPrivate: z.boolean(),
  adminId: z.string(),
  startDate: z.string(),
  addAdminAsPlayer: z.boolean(),
  period: periodSchema,
});

export const createGame = onRequest(async (req, res) => {
  const db = getDb();
  const validated = createGamePayloadSchema.parse(req.body);
  let newGameId;
  let admin;
  const periodString: string = typeof validated.period === "string" ?
    validated.period :
    "quantity" in validated.period ?
      `${validated.period.quantity}-${validated.period.unit}` :
      `${validated.period.recurrence}-${validated.period.dayOfWeek}`;

  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(games).values({
      name: validated.name,
      description: validated.description,
      isPrivate: validated.isPrivate,
      adminId: validated.adminId,
      startDate: validated.startDate,
      period: periodString,
    }).returning({
      insertedId: games.id,
    });
    admin = await tx.select().from(users).where(eq(users.id, validated.adminId)).limit(1);
    if (admin.length === 0) {
      throw new Error("Admin not found");
    }
    const {
      id,
      email,
      username= null,
    } = admin[0];
    admin = {
      id,
      name: username || email,
    };
    newGameId = inserted.insertedId;
    if (validated.addAdminAsPlayer) {
      await tx.insert(gamesToUsers).values({
        gameId: newGameId,
        userId: validated.adminId,
      });
    }
  });
  res.status(201).send({
    id: newGameId,
    admin,
    ...validated,
  });
});
