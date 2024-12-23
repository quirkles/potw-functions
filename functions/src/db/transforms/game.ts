import {TSqlGame, sqlGameSchema} from "@potw/schemas";

import {SelectGame} from "../schema/game";

export function selectGameToSqlGame(selectGame: SelectGame): TSqlGame {
  return sqlGameSchema.parse({
    sqlId: selectGame.id,
    firestoreId: selectGame.firestoreId,

    name: selectGame.name,
    description: selectGame.description,
    startDate: selectGame.startDate,
    endDate: selectGame.endDate,
    regularScheduledStartTimeUtc: selectGame.regularScheduledStartTimeUtc,
    period: selectGame.period,
    isPrivate: selectGame.isPrivate,
    adminSqlId: selectGame.adminId,

    createdAt: selectGame.createdAt,
    updatedAt: selectGame.updatedAt,
  });
}
