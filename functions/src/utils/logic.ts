import {Maybe} from "../typeUtils";

export function isNotEmpty<T>(value: Maybe<T>): value is T {
  return value !== null && value !== undefined;
}

export function getTrueFalse(bias: number = 0.5): boolean {
  if (bias < 0 || bias > 1) {
    throw new Error("Bias must be between 0 and 1");
  }
  return Math.random() < bias;
}
