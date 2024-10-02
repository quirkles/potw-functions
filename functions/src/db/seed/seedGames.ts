import {faker} from "@faker-js/faker";
import {DocumentReference} from "@google-cloud/firestore";
import {sub} from "date-fns";
import {add} from "date-fns/add";

import {getRandomElement, removeElements, shuffle} from "../../utils/array";
import {getTrueFalse} from "../../utils/logic";
import {getRandomIntegerInRange} from "../../utils/number";
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
  const start = sub(new Date(), {
    weeks: 4,
  });

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
        length: 12,
      }).map((_, i) => (add(start, {
        weeks: i,
      })));
      for (const week of weeks) {
        const gameOneRef = firestore.collection("games").doc();

        const gameOnePlayers = shuffle(userIds).slice(0, getRandomIntegerInRange(6, 10));

        firestoreGameRefs.push(gameOneRef);

        const gameOnePayload = getGamePayload({
          adminId: userId,
          firestoreId: gameOneRef.id,
          startDate: week,
          playerIds: gameOnePlayers,
        });

        const playersByFirestoreId: {
            [firestoreId: string]: string[]
        } = {};

        const otherGames = Array.from({
          length: getRandomIntegerInRange(4, 6),
        }).map(() => {
          const gamePlayers = shuffle(removeElements(userIds, [userId])).slice(0, getRandomIntegerInRange(6, 10));
          const adminId = getRandomElement(removeElements(gamePlayers, [userId]));
          const gameRef = firestore.collection("games").doc();
          firestoreGameRefs.push(gameRef);
          if (getTrueFalse(0.2)) {
            gamePlayers.push(userId);
          }
          playersByFirestoreId[gameRef.id] = gamePlayers;
          return getGamePayload({
            adminId: adminId,
            firestoreId: gameRef.id,
            startDate: week,
            playerIds: gamePlayers,
          });
        });

        await tx.insert(games).values([
          gameOnePayload,
          ...otherGames,
        ]).returning({
          sqlId: games.id,
          firestoreId: games.firestoreId,
          status: games.status,
          startDate: games.startDate,
        }).then((result) => {
          results.push(...result);
          const [gameOneResult, ...others] = result;
          return Promise.all([
            ...gameOnePlayers.map((userId) =>
              tx.insert(gamesToUsers).values({
                gameId: gameOneResult.sqlId,
                userId: userId,
              }).onConflictDoNothing()
            ),
            ...others.flatMap((game) => {
              return playersByFirestoreId[game.firestoreId].map((userId) =>
                tx.insert(gamesToUsers).values({
                  gameId: game.sqlId,
                  userId,
                }).onConflictDoNothing()
              );
            }),
          ]);
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
    description: getTrueFalse(0.6) ? faker.lorem.sentence() : null,
    isPrivate: getTrueFalse(0.2),
    adminId,
    firestoreId,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
    status: new Date(startDate) < new Date() ? "active" : "pending",
    period: getRandomElement(
      [
        "every-thursday",
        "every-friday",
        "every-saturday",
      ]
    ),
  };
}
