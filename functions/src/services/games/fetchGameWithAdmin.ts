import {eq} from "drizzle-orm";

import {getDb} from "../../db/dbClient";
import {games, SelectGame} from "../../db/schema/game";
import {SelectUser, users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {selectGameToSqlGame, SqlGame} from "../../validation/sqlGame";
import {selectUserToSqlUser, SqlUser} from "../../validation/sqlUser";

interface GameWithAdmin {
    game: SqlGame,
    admin: SqlUser
}

export async function fetchGameWithAdmin(args: {sqlId: string}): Promise<GameWithAdmin>
export async function fetchGameWithAdmin(args: {firestoreId: string}): Promise<GameWithAdmin>
export async function fetchGameWithAdmin(args: {firestoreId: string} | {sqlId: string}): Promise<GameWithAdmin> {
  if ("sqlId" in args) {
    return getDb()
      .select()
      .from(games)
      .leftJoin(users, eq(games.adminId, users.id))
      .where(
        eq(
          games.id,
          args.sqlId
        )
      ).then(transformJoinResult);
  }
  if ("firestoreId" in args) {
    return getDb()
      .select()
      .from(games)
      .leftJoin(users, eq(games.adminId, users.id))
      .where(
        eq(
          games.firestoreId,
          args.firestoreId
        )
      ).then(transformJoinResult);
  }
  throw new Error("Invalid arguments");
}


function transformJoinResult(result: {
    games: SelectGame,
    users: SelectUser | null
}[]): GameWithAdmin {
  const logger = getLogger();
  logger.info("fetchGameWithAdmin: begin");
  let game: SelectGame | null = null;
  let admin: SelectUser | null = null;
  for (const row of result) {
    logger.info("fetchGameWithAdmin: row", {
      rowData: row,
    });
    if (game === null) {
      game = row.games;
    }
    if (row.users !== null) {
      admin = row.users;
    }
  }
  if (game === null) {
    throw new Error("Game not found");
  }
  if (admin === null) {
    throw new Error("Admin not found");
  }
  logger.info("fetchGameWithAdmin: complete", {
    game,
    admin,
  });
  return {
    game: selectGameToSqlGame(game),
    admin: selectUserToSqlUser(admin),
  };
}
