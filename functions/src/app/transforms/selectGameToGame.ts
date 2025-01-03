import {TSqlGame} from "@potw/schemas";

import {SelectGame} from "../../db/schema/game";

export function selectGameToGame(game: SelectGame):TSqlGame {
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
