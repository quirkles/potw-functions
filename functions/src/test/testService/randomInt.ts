import {getLogger} from "../../functionWrapper";

export function randomInt(min: number, max: number): number {
  const logger = getLogger();
  logger.info("Generating random number", {
    min,
    max,
  });
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
