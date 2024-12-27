import {TSqlGame, TSqlGameWithRelations} from "@potw/schemas";
import {eq} from "drizzle-orm";

import {selectUserToReturnUser} from "../../app/transforms/selectUserToReturnUser";
import {getDb} from "../../db/dbClient";
import {SelectUser, users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {NotFoundError} from "../../utils/Errors";


export async function fetchGamesForUser(userId: string): Promise<TSqlGameWithRelations[]> {
  const db = getDb();
  const logger = getLogger();

  const [withGames] = await Promise.all([db.query.users.findFirst({
    where: eq(users.id, String(userId)),
    with: {
      gamesAsParticipant: {
        with: {
          game: {
            with: {
              players: {
                with: {
                  user: true,
                },
              },
              admin: true,
            },
          },
        },
      },
      gamesAsAdmin: {
        with: {
          players: {
            with: {
              user: true,
            },
          },
          admin: true,
        },
      },
    },
  })]);

  if (!withGames) {
    logger.warning("fetchGames: User not found in db", {
      userId,
    });
    throw new NotFoundError("User not found");
  }

  logger.debug("fetchGames: games as participant", {
    games: withGames.gamesAsParticipant,
  });
  logger.debug("fetchGames: games as admin", {
    games: withGames.gamesAsAdmin,
  });

  const allGames = (
    withGames.gamesAsParticipant
      .map(
        (p): TSqlGameWithRelations => ({
          ...p.game,
          sqlId: p.game.id,
          adminSqlId: p.game.admin.id,
          players: p.game.players.map((player) => ({
            sqlId: player.user.id,
            ...player.user,
          })),
          period: p.game.period,
          admin: selectUserToReturnUser(p.game.admin as SelectUser),
        })
      )
      .concat(withGames.gamesAsAdmin.map(
        (g): TSqlGameWithRelations => ({
          ...g,
          sqlId: g.id,
          players: g.players.map((player) => ({
            sqlId: player.user.id,
            ...player.user,
          })),
          adminSqlId: g.admin.id,
          period: g.period,
          admin: selectUserToReturnUser(g.admin as SelectUser),
        }))
      )
  ).reduce((acc, game) => {
    if (!game) {
      return acc;
    }
    if (acc[game.sqlId]) {
      return acc;
    } else {
      acc[game.sqlId] = game;
    }
    return acc;
  }, {} as Record<string, TSqlGame>);

  logger.info("fetchGames success", {
    games: Object.values(allGames)
      .map((g) => ({
        id: g.sqlId,
        name: g.name,
      })),
  });
  return Object.values(allGames);
}
