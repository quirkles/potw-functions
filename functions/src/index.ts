import * as appFunctions from "./app/functions";
import * as testFunctions from "./test/functions";


const {
  auth,
  user,
  game,
  gameWeeks,
  documentListeners,
} = appFunctions;

const {
  initiateDailyGameUpdateHttp,
  ...appGameFunctions
} = game;

export const app = {
  auth,
  user,
  game: appGameFunctions,
  gameWeeks,
  documentListeners,
};

export const dev = {
  game: {
    initiateDailyGameUpdateHttp,
  },
};

const {
  testBody,
  testResponse,
  testLogger,
  testResponseAndBody,
  pingDb,
} = testFunctions;

export const test = {
  body: testBody,
  response: testResponse,
  logger: testLogger,
  responseAndBody: testResponseAndBody,
  ping: pingDb,
};
