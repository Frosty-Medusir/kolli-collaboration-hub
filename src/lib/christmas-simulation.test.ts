import { describe, expect, it } from "vitest";
import { clearSnow, climberPose, depositSnow } from "./christmas-simulation";

describe("Christmas snow interaction", () => {
  it("snow builds up and stays below nine pixels", () => {
    expect(depositSnow(0, 10)).toBeCloseTo(3.2);
    expect(depositSnow(8, 100)).toBe(9);
  });
  it("sweeping removes snow without negative depths", () => {
    expect(clearSnow(9, 1)).toBe(3);
    expect(clearSnow(3, 1)).toBe(0);
  });
  it("climbs to a new letter then sweeps on its surface", () => {
    const surfaces = [{ x: 10, y: 100, width: 20, depth: 4 }, { x: 110, y: 200, width: 20, depth: 4 }];
    expect(climberPose(4, surfaces)).toMatchObject({ x: 20, y: 100, sweeping: true, target: 0 });
    expect(climberPose(9, surfaces).y).toBeLessThan(150);
    expect(climberPose(11, surfaces)).toMatchObject({ x: 120, y: 200, sweeping: true, target: 1 });
  });
});