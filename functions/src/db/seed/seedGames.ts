import {faker} from "@faker-js/faker";
import {DocumentReference} from "@google-cloud/firestore";
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
    userIds: [string, ...string[]],
    ensureIncludedUserIds: [string, ...string[]],
}

export async function seedGames({
  userIds,
  ensureIncludedUserIds,
}: ISeedGamesProps) {
  const now = new Date();

  const firestoreGameRefs: DocumentReference[] = [];

  const db = getDb();

  const sqlInsertResults = await db.transaction(async (tx) => {
    const results: {
        sqlId: string,
        firestoreId: string,
        status: string,
        startDate: string,
    }[] = [];
    for (const userId of ensureIncludedUserIds) {
      const weeks: Date[] = Array.from({
        length: 6,
      }).map((_, i) => (add(now, {
        weeks: (i - 2),
      })));
      for (const week of weeks) {
        const gameOneRef = firestore.collection("games").doc();
        const gameTwoRef = firestore.collection("games").doc();

        const gameOnePlayers = shuffle(userIds).slice(0, getRandomIntegerInRange(6, 10));
        const gameTwoPlayers = shuffle(userIds).slice(0, getRandomIntegerInRange(6, 10));

        firestoreGameRefs.push(gameOneRef, gameTwoRef);

        const gameOnePayload = getGamePayload({
          adminId: userId,
          firestoreId: gameOneRef.id,
          startDate: week,
          playerIds: gameOnePlayers,
        });

        const gameTwoPayload = getGamePayload({
          adminId: getRandomElement(gameTwoPlayers),
          firestoreId: gameTwoRef.id,
          startDate: week,
          playerIds: [userId, ...gameTwoPlayers],
        });

        await tx.insert(games).values([
          gameOnePayload,
          gameTwoPayload,
        ]).returning({
          sqlId: games.id,
          firestoreId: games.firestoreId,
          status: games.status,
          startDate: games.startDate,
        }).then((result) => {
          results.push(...result);
          const [gameOneResult, gameTwoResult] = result;
          return Promise.all([
            ...gameOnePlayers.map((userId) =>
              tx.insert(gamesToUsers).values({
                gameId: gameOneResult.sqlId,
                userId: userId,
              }).onConflictDoNothing()
            ),
            ...gameTwoPlayers.map((userId) =>
              tx.insert(gamesToUsers).values({
                gameId: gameTwoResult.sqlId,
                userId: userId,
              })
            )]);
        });
      }
    }
    return results;
  });

  const firestoreIdToGame = sqlInsertResults.reduce((acc: {
      [firestoreId: string]: {
        sqlId: string,
        status: string,
        startDate: string,
      },
  }, {sqlId, firestoreId, status, startDate}) => {
    acc[firestoreId] = {
      sqlId,
      status,
      startDate,
    };
    return acc;
  }, {});

  const batch = firestore.batch();
  for (const ref of firestoreGameRefs) {
    batch.set(ref, {
      sqlId: firestoreIdToGame[ref.id].sqlId,
      status: firestoreIdToGame[ref.id].status,
      startDate: firestoreIdToGame[ref.id].startDate,
    });
  }
  await batch.commit();
}
function getGamePayload({
  adminId,
  firestoreId,
  startDate,
}: {
  adminId: string,
  firestoreId: string,
  playerIds: string[],
  startDate: Date,
}): {
    name: string,
    description: string | null,
    isPrivate: boolean,
    adminId: string,
    firestoreId: string,
    startDate: string,
    endDate: string | null,
    period: string,
    status: "active" | "pending",
  } {
  const endDate = getTrueFalse(0.8) ? add(startDate, {
    weeks: getRandomIntegerInRange(12, 52),
  }) : null;
  return {
    name: `${faker.word.adjective()}-${faker.color.human()}-${faker.animal.type()}`,
    description: getTrueFalse(0.2) ? faker.lorem.sentence() : null,
    isPrivate: getTrueFalse(0.4),
    adminId,
    firestoreId,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
    status: new Date(startDate) < new Date() ? "active" : "pending",
    period: getRandomElement(
      removeElements(
        [...allPeriodStrings],
        ["daily", "biWeekly"]
      )
    ),
  };
}
