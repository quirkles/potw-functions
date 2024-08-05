import {onRequest} from "firebase-functions/v2/https";
import {getDb} from "../../db/dbClient";
import {eq} from "drizzle-orm";
import {SelectUser, users} from "../../db/schema/user";
import {SelectGame} from "../../db/schema/game";
import {GamePeriod, periodStringToPeriod} from "./transforms";
import {ReturnUser, selectUserToReturnUser} from "../users/transform";
import {createLogger} from "../../services/Logger/Logger.pino";
import {getConfig} from "../../config";
import {v4} from "uuid";

type FetchGamesResponse = Omit<SelectGame, "players" | "period" |"admin"> & {
    sqlId: string;
    players: string[];
    period: GamePeriod;
    admin: ReturnUser;
}

export const fetchGames = onRequest(async (req, res) => {
  const logger = createLogger({
    logName: "fetchGames",
    shouldLogToConsole: getConfig().env === "local",
    labels: {
      functionExecutionId: v4(),
      correlationId: req.headers["x-correlation-id"] as string || v4(),
    },
  });

  logger.info("fetchGames begin", {query: req.query});

  const userId = req.query.userId;

  if (!userId) {
    logger.warning("userId is required");
    res.status(400).send("userId is required");
    return;
  }

  const db = getDb();
  const [withGames] = await Promise.all([db.query.users.findFirst({
    where: eq(users.id, String(userId)),
    with: {
      gamesAsParticipant: {
        with: {
          game: {
            with: {
              players: true,
              admin: true,
            },
          },
        },
      },
      gamesAsAdmin: {
        with: {
          players: true,
          admin: true,
        },
      },
    },

  })]);

  if (!withGames) {
    logger.warning("fetchGames: User not found in db", {
      userId,
    });
    res.status(404).send("User not found");
    return;
  }

  const allGames = (
    withGames.gamesAsParticipant
      .map(
        (p): FetchGamesResponse => ({
          ...p.game,
          sqlId: p.game.id,
          players: p.game.players.map((player) => player.userId),
          period: periodStringToPeriod(p.game.period),
          admin: selectUserToReturnUser(p.game.admin as SelectUser),
        })
      )
      .concat(withGames.gamesAsAdmin.map(
        (g): FetchGamesResponse => ({
          ...g,
          sqlId: g.id,
          players: g.players.map((player) => player.userId),
          period: periodStringToPeriod(g.period),
          admin: selectUserToReturnUser(g.admin as SelectUser),
        }))
      )
  ).reduce((acc, game) => {
    if (!game) {
      return acc;
    }
    if (acc[game.id]) {
      return acc;
    } else {
      acc[game.id] = game;
    }
    return acc;
  }, {} as Record<string, FetchGamesResponse>);

  logger.info("fetchGames success", {
    games: Object.values(allGames)
      .map((g) => ({
        id: g.sqlId,
        name: g.name,
      })),
  });

  res.status(201).send({
    games: Object.values(allGames),
  });
});
