import {eq} from "drizzle-orm";

import {selectUserToReturnUser} from "../../app/users/transform";
import {getDb} from "../../db/dbClient";
import {SelectUser, users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {NotFoundError} from "../../utils/Errors";
import {Game} from "../../validation/game";
import {GameWithRelations} from "../../validation/withRelations";


export async function fetchGamesForUser(userId: string): Promise<GameWithRelations[]> {
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
        (p): GameWithRelations => ({
          ...p.game,
          sqlId: p.game.id,
          players: p.game.players.map((player) => ({
            sqlId: player.user.id,
            ...player.user,
          })),
          period: p.game.period,
          admin: selectUserToReturnUser(p.game.admin as SelectUser),
        })
      )
      .concat(withGames.gamesAsAdmin.map(
        (g): GameWithRelations => ({
          ...g,
          sqlId: g.id,
          players: g.players.map((player) => ({
            sqlId: player.user.id,
            ...player.user,
          })),
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
  }, {} as Record<string, Game>);

  logger.info("fetchGames success", {
    games: Object.values(allGames)
      .map((g) => ({
        id: g.sqlId,
        name: g.name,
      })),
  });
  return Object.values(allGames);
}
