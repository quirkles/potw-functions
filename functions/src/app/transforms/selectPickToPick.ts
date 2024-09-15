import {SelectPick} from "../../db/schema/picks";
import {Pick} from "../../validation/pick";

export function selectPickToPick(pick: SelectPick): Pick {
  return {
    sqlId: pick.id,
    gameWeekSqlId: pick.gameWeekId,
    userSqlId: pick.userId,
    createdAt: pick.createdAt,
    updatedAt: pick.updatedAt,
    artist: pick.artist,
    spotifyTrackId: pick.spotifyTrackId,
    title: pick.title,
    youtubeTrackId: pick.youtubeTrackId,
    youtubeVideoId: pick.youtubeVideoId,
  };
}
