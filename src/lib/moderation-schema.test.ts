import { describe, expect, it } from "vitest";
import { banActionSchema } from "./moderation-schema";

const userId = "00000000-0000-4000-8000-000000000001";
describe("moderation ban validation", () => {
  it("requires a reason for a ban", () => {
    expect(banActionSchema.safeParse({ userId, banned: true, reason: "" }).success).toBe(false);
    expect(banActionSchema.safeParse({ userId, banned: true, reason: "Harassment" }).success).toBe(true);
  });
  it("allows removal of a ban without another reason", () => {
    expect(banActionSchema.safeParse({ userId, banned: false, reason: "" }).success).toBe(true);
  });
});