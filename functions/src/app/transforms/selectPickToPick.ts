import {TSqlPick} from "@potw/schemas";

import {SelectPick} from "../../db/schema/picks";

export function selectPickToPick(pick: SelectPick): TSqlPick {
  return {
    sqlId: pick.id,
    firestoreId: pick.firestoreId,
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
