import {SelectGameWeek} from "../../db/schema/gameWeek";
import {GameWeek} from "../../validation/gameWeek";

export function selectGameWeekToGameWeek(gameWeek: SelectGameWeek): GameWeek {
  return {
    gameSqlId: gameWeek.gameId,
    sqlId: gameWeek.id,
    startDateTime: gameWeek.startDateTime,
    theme: gameWeek.theme,
    meetingLink: gameWeek.meetingLink,
  };
}
