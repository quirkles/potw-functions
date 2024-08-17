import {Maybe} from "../typeUtils";

export function isNotEmpty<T>(value: Maybe<T>): value is T {
  return value !== null && value !== undefined;
}
