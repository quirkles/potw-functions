import {describe, expect, it} from "@jest/globals";
import {deepMerge} from "./object";


describe("deepMerge", () => {
  // Merging two objects with non-conflicting keys
  it("should merge two objects with non-conflicting keys", () => {
    const target = {a: 1, b: 2};
    const source = {c: 3, d: 4};
    const result = deepMerge(target, source);
    expect(result).toEqual({a: 1, b: 2, c: 3, d: 4});
  });

  // Merging two objects with nested objects
  it("should merge two objects with nested objects", () => {
    const target = {a: 1, b: {c: 2}};
    const source = {b: {d: 3}, e: 4};
    const result = deepMerge(target, source);
    expect(result).toEqual({a: 1, b: {c: 2, d: 3}, e: 4});
  });

  // Merging two objects where one object is empty
  it("should merge when one object is empty", () => {
    const target = {a: 1, b: 2};
    const source = {};
    const result = deepMerge(target, source);
    expect(result).toEqual({a: 1, b: 2});
  });

  // Merging objects with null or undefined values
  it("should merge objects with null or undefined values when merging", () => {
    const target = {a: 1, b: null, c: undefined};
    const source = {b: 2, c: 3, d: 4};
    const result = deepMerge(target, source);
    expect(result).toEqual({a: 1, b: 2, c: 3, d: 4});
  });
});
