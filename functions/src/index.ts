import {handleGoogleLogin} from "./auth/handleGoogleLogin";
import {handleSpotifyLogin} from "./auth/handleSpotifyLogin";
import {handleEmailLogin} from "./auth/handleEmailLogin";
import {verifyOtpFn as verifyOtp} from "./auth/verifyOtp";
import {createUser} from "./auth/createUser";

import {createGame} from "./games/createGame";

import {fetchUserById} from "./users/fetchUserById";

export {
  handleGoogleLogin,
  handleSpotifyLogin,
  handleEmailLogin,
  verifyOtp,
  createUser,
  createGame,
  fetchUserById,
};
