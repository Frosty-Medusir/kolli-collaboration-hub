import { describe, expect, it } from "vitest";
import { buildIcebreaker, isTelepartyUrl, toggleVibe, vibesCompatible } from "./vibes";

describe("vibe filters", () => {
  it("Chatty and Silent Watcher do not match", () => expect(vibesCompatible(["chatty"], ["silent"])).toBe(false));
  it("Mic On and Text Only do not match", () => expect(vibesCompatible(["text_only"], ["mic_on"])).toBe(false));
  it("Chatty matches Mic On", () => expect(vibesCompatible(["chatty"], ["mic_on"])).toBe(true));
  it("no tags matches anyone", () => expect(vibesCompatible([], ["silent", "text_only"])).toBe(true));
  it("picking Silent Watcher replaces Chatty", () => expect(toggleVibe(["chatty", "mic_on"], "silent")).toEqual(["mic_on", "silent"]));
});

describe("teleparty links", () => {
  it("accepts https teleparty.com", () => expect(isTelepartyUrl("https://redirect.teleparty.com/join/abc")).toBe(true));
  it("rejects lookalike hosts", () => expect(isTelepartyUrl("https://teleparty.com.evil.io/x")).toBe(false));
  it("rejects http", () => expect(isTelepartyUrl("http://teleparty.com/x")).toBe(false));
});

describe("icebreaker", () => {
  it("uses the director and year", () => expect(buildIcebreaker({ title: "Inception", director: "Christopher Nolan", year: "2010" })).toContain("directed by Christopher Nolan and came out in 2010"));
});
