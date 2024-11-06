import {SelectGame} from "../../db/schema/game";
import {SqlGame} from "../../validation/sqlGame";

export function selectGameToGame(game: SelectGame): SqlGame {
  return {
    sqlId: game.id,
    firestoreId: game.firestoreId,
    name: game.name,
    description: game.description,
    isPrivate: game.isPrivate,
    adminSqlId: game.adminId,
    endDate: game.endDate,
    period: game.period,
    regularScheduledStartTimeUtc: game.regularScheduledStartTimeUtc,
    startDate: game.startDate,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}
