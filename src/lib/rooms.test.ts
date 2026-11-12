import { describe, expect, it } from "vitest";
import { roomInviteUrl } from "./rooms";

describe("automatic Kolli room invitations", () => {
  it("both participants get the same room link for their match", () => {
    expect(roomInviteUrl("https://kolli.example", "match-one")).toBe("https://kolli.example/lobby/match-one");
  });
  it("different matches have separate room invitations", () => {
    expect(roomInviteUrl("https://kolli.example", "match-one")).not.toBe(roomInviteUrl("https://kolli.example", "match-two"));
  });
});