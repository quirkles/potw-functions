import {SelectGameWeek} from "../../db/schema/gameWeek";
import {SqlGameWeek} from "../../validation/sqlGameWeek";

export function selectGameWeekToGameWeek(gameWeek: SelectGameWeek): SqlGameWeek {
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
