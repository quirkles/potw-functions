import {describe, expect, it} from "@jest/globals";

import {timeStringRegex} from "./dates";

describe("TimeRegex", () => {
  it("matches valid times", () => {
    const validTimes = [
      "00:00:00",
      "01:00:00",
      "05:55:00",
      "12:34:00",
      "23:59:00",
    ];
    for (const time of validTimes) {
      expect(timeStringRegex.test(time)).toBe(true);
    }
  });
  it("does not match invalid times", () => {
    const invalidTimes = [
      "24:00:00",
      "00:60:00",
      "00:00:60",
      "00:00",
      "00:00:0",
      "00:0:00",
      "0",
      "00",
    ];
    for (const time of invalidTimes) {
      expect(timeStringRegex.test(time)).toBe(false);
    }
  });
});
