import {onRequest} from "firebase-functions/v2/https";
import {getDb} from "../../db/dbClient";
import {eq} from "drizzle-orm";
import {users} from "../../db/schema/user";
import {SelectGame} from "../../db/schema/game";


type GameWithIsAdmin = SelectGame & { isAdmin: boolean };
export const fetchGames = onRequest(async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    res.status(400).send("userId is required");
    return;
  }

  const db = getDb();
  const [withGames] = await Promise.all([db.query.users.findFirst({
    where: eq(users.id, String(userId)),
    with: {
      gamesAsParticipant: {
        with: {
          game: true,
        },
      },
      gamesAsAdmin: true,
    },
  })]);

  if (!withGames) {
    res.status(404).send("User not found");
    return;
  }

  const allGames = withGames.gamesAsParticipant
    .map((g): GameWithIsAdmin => {
      return {
        ...g.game,
        isAdmin: false,
      };
    })
    .concat(withGames.gamesAsAdmin.map((g): GameWithIsAdmin => {
      return {
        ...g,
        isAdmin: true,
      };
    })).reduce((acc, game) => {
      if (acc[game.id]) {
        acc[game.id]["isAdmin"] = acc[game.id]["isAdmin"] || game["isAdmin"];
      } else {
        acc[game.id] = game;
      }
      return acc;
    }, {} as Record<string, GameWithIsAdmin>);

  res.status(200).json(allGames);

  return;
});
