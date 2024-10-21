import {SelectGameWeek} from "../../db/schema/gameWeek";
import {GameWeek} from "../../validation/gameWeek";

export function selectGameWeekToGameWeek(gameWeek: SelectGameWeek): GameWeek {
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
