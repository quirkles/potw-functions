import {selectUserToReturnUser} from "../../app/users/transform";
import {getDb} from "../../db/dbClient";
import {SelectUser} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {GameWithRelations} from "../../validation/withRelations";


export async function fetchManyGames({
  limit,
}: {
    limit: number;
}): Promise<GameWithRelations[]> {
  const db = getDb();
  const logger = getLogger();

  const [withGames] = await Promise.all([db.query.games.findMany({
    with: {
      players: {
        with: {
          user: true,
        },
      },
      admin: true,
    },
    limit,
  },
  )]);

  logger.debug("fetchGames: games as participant", {
    games: withGames,
  });

  const allGames = (
    withGames.map(
      (game): GameWithRelations => ({
        ...game,
        sqlId: game.id,
        players: game.players.map((player) => ({
          sqlId: player.user.id,
          ...player.user,
        })),
        period: game.period,
        admin: selectUserToReturnUser(game.admin as SelectUser),
      })
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
  }, {} as Record<string, GameWithRelations>);

  logger.info("fetchGames success", {
    games: Object.values(allGames)
      .map((g) => ({
        id: g.sqlId,
        name: g.name,
      })),
  });
  return Object.values(allGames);
}
