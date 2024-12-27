import {TSqlGameWeek} from "@potw/schemas";

import {SelectGameWeek} from "../../db/schema/gameWeek";

export function selectGameWeekToGameWeek(gameWeek: SelectGameWeek):TSqlGameWeek {
  return {
    gameSqlId: gameWeek.gameId,
    firestoreId: gameWeek.firestoreId,
    sqlId: gameWeek.id,
    startDateTime: gameWeek.startDateTime,
    status: gameWeek.status,
    theme: gameWeek.theme,
    meetingLink: gameWeek.meetingLink,
  };
}
