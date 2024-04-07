import * as appFunctions from "./app/functions";
import * as testFunctions from "./test/functions";

const {
  auth,
  user,
  game,
} = appFunctions;

export const app = {
  auth,
  user,
  game,
};

const {
  testBody,
  testResponse,
  testLogger,
  testResponseAndBody,
} = testFunctions;

export const test = {
  body: testBody,
  response: testResponse,
  logger: testLogger,
  responseAndBody: testResponseAndBody,
};
