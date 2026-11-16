export type SnowSurface = { x: number; y: number; width: number; depth: number };
export const SNOW_MAX_DEPTH = 9;
export const CLIMB_SECONDS = 4;
export const SWEEP_SECONDS = 3;

export function depositSnow(depth: number, seconds: number): number {
  return Math.min(SNOW_MAX_DEPTH, depth + seconds * 0.32);
}
export function clearSnow(depth: number, seconds: number): number {
  return Math.max(0, depth - seconds * 6);
}
export function climberPose(time: number, surfaces: readonly SnowSurface[]) {
  if (!surfaces.length) return { x: 0, y: 0, climbing: false, sweeping: false, target: 0, facing: 1 };
  const cycle = CLIMB_SECONDS + SWEEP_SECONDS;
  const step = Math.floor(time / cycle);
  const target = step % surfaces.length;
  const previous = (target + surfaces.length - 1) % surfaces.length;
  const a = surfaces[previous];
  const b = surfaces[target];
  if (!a || !b) return { x: 0, y: 0, climbing: false, sweeping: false, target: 0, facing: 1 };
  const phase = time % cycle;
  const progress = Math.min(phase / CLIMB_SECONDS, 1);
  const eased = progress * progress * (3 - 2 * progress);
  const ax = a.x + a.width / 2;
  const bx = b.x + b.width / 2;
  return {
    x: ax + (bx - ax) * eased,
    y: progress === 1 ? b.y : a.y + (b.y - a.y) * eased - Math.sin(progress * Math.PI) * 65,
    climbing: phase < CLIMB_SECONDS,
    sweeping: phase >= CLIMB_SECONDS,
    target,
    facing: bx >= ax ? 1 : -1,
  };
}

// Mutable browser animation state; never holds user or application data.
export const christmasScene = {
  time: 4, surfaces: [] as SnowSurface[],
  pose: { x: 0, y: 0, climbing: false, sweeping: false, target: 0, facing: 1 },
};