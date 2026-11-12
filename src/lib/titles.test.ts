import { describe, it, expect } from "vitest";
import { DISPLAY_NAME_RE, isKosmiUrl, searchTitles } from "./titles";

describe("kolli rules", () => {
  it("display names must be 3-24 letters, numbers, spaces, hyphens or underscores", () => {
    expect(DISPLAY_NAME_RE.test("Jo")).toBe(false);
    expect(DISPLAY_NAME_RE.test("Joseph O")).toBe(true);
    expect(DISPLAY_NAME_RE.test("a".repeat(25))).toBe(false);
    expect(DISPLAY_NAME_RE.test("bad!name")).toBe(false);
  });
  it("only HTTPS kosmi.io room links are accepted", () => {
    expect(isKosmiUrl("https://app.kosmi.io/room/abc")).toBe(true);
    expect(isKosmiUrl("http://kosmi.io/room/abc")).toBe(false);
    expect(isKosmiUrl("https://evilkosmi.io/x")).toBe(false);
  });
  it("search filters by type", () => {
    expect(searchTitles("", "movie").map((t) => t.id)).toEqual([5]);
  });
});
