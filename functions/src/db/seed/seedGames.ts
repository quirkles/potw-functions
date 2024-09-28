import {faker} from "@faker-js/faker";
import {add} from "date-fns/add";

import {getRandomElement, removeElements, shuffle} from "../../utils/array";
import {getTrueFalse} from "../../utils/logic";
import {getRandomIntegerInRange} from "../../utils/number";
import {allPeriodStrings} from "../../validation/game";
import {games} from "../schema/game";
import {gamesToUsers} from "../schema/gamesToUsers";

import {firestore} from "./firestore";
import {getDb} from "./getDb";

interface ISeedGamesProps {
    count?: number,
    userIds: [string, ...string[]],
}

export async function seedGames({
  count = 100,
  userIds,
}: ISeedGamesProps) {
  const results: string[] = [];
  let scriptTimedOut = false;
  const timeout = setTimeout(() => {
    scriptTimedOut = true;
  }, 1000 * 60 * 5);
  let remaining = count;
  while (remaining > 0 && !scriptTimedOut) {
    console.log(`Creating game ${remaining} of ${count}`);
    const shuffledUserIds = shuffle(userIds);
    const adminId = shuffledUserIds.pop();
    if (!adminId) {
      continue;
    }
    const playerIds = shuffledUserIds.slice(0, getRandomIntegerInRange(4, Math.min(shuffledUserIds.length, 10)));
    const newGameRef = firestore.collection("games").doc();
    const sqlId = await createGame({
      playerIds,
      adminId: adminId,
      firestoreId: newGameRef.id,
    });
    if (!sqlId) {
      continue;
    }

    await newGameRef.set({
      sqlId,
    });

    remaining--;
  }
  clearTimeout(timeout);
  return results;
}
async function createGame({
  adminId,
  playerIds,
  firestoreId,
}: {
  adminId: string,
  firestoreId: string,
  playerIds: string[],
}): Promise<null | string> {
  const includeAdmin = getTrueFalse(0.8);
  const db = getDb();
  const startDate = faker.date.soon();
  const endDate = getTrueFalse(0.8) ? add(startDate, {
    weeks: getRandomIntegerInRange(8, 52),
  }) : null;
  let newGameId: string | null = null;
  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(games).values({
      name: `${faker.word.adjective()}-${faker.color.human()}-${faker.animal.type()}`,
      description: getTrueFalse(0.2) ? faker.lorem.sentence() : null,
      isPrivate: getTrueFalse(0.4),
      adminId,
      firestoreId,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
      period: getRandomElement(
        removeElements(
          [...allPeriodStrings],
          ["daily", "biWeekly"]
        )
      ),
    }).returning({
      insertedId: games.id,
    });
    if (inserted.insertedId === null) {
      throw new Error("Game not inserted");
    }
    if (includeAdmin) {
      playerIds.push(adminId);
    }
    await tx.insert(gamesToUsers)
      .values(
        playerIds.map(
          (playerId) => ({
            gameId: inserted.insertedId,
            userId: playerId,
          })
        )
      );
    newGameId = inserted.insertedId;
  });

  return newGameId;
}
