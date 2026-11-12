export const VIBES = [
  { id: "chatty", label: "Chatty" },
  { id: "silent", label: "Silent Watcher" },
  { id: "mic_on", label: "Mic On" },
  { id: "text_only", label: "Text Only" },
] as const;
export type Vibe = (typeof VIBES)[number]["id"];
const CONFLICTS: [Vibe, Vibe][] = [["chatty", "silent"], ["mic_on", "text_only"]];

/** Mirrors the database rule: two people match unless their tags directly contradict. */
export function vibesCompatible(a: readonly Vibe[], b: readonly Vibe[]): boolean {
  return !CONFLICTS.some(([x, y]) => (a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x)));
}

/** Picking one side of a pair removes the other, so a person can't be both. */
export function toggleVibe(current: readonly Vibe[], v: Vibe): Vibe[] {
  if (current.includes(v)) return current.filter((x) => x !== v);
  const opposite = CONFLICTS.flatMap(([x, y]) => (x === v ? [y] : y === v ? [x] : []));
  return [...current.filter((x) => !opposite.includes(x)), v];
}

export const BADGES = [
  { id: "great_chat", label: "Great Chat" },
  { id: "good_vibes", label: "Good Vibes" },
  { id: "movie_buff", label: "Movie Buff" },
] as const;
export type BadgeId = (typeof BADGES)[number]["id"];

export function isTelepartyUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" && (u.hostname === "teleparty.com" || u.hostname.endsWith(".teleparty.com"));
  } catch { return false; }
}

export function buildIcebreaker(d: { title: string; tagline?: string | undefined; year?: string | undefined; runtime?: number | undefined; director?: string | undefined; seasons?: number | undefined; budget?: number | undefined; topCast?: string | undefined }): string {
  const facts: string[] = [];
  if (d.director) facts.push(`${d.title} was directed by ${d.director}${d.year ? ` and came out in ${d.year}` : ""}.`);
  else if (d.year) facts.push(`${d.title} first came out in ${d.year}.`);
  if (d.tagline) facts.push(`Its tagline: “${d.tagline}”`);
  if (d.seasons) facts.push(`It ran for ${d.seasons} season${d.seasons > 1 ? "s" : ""}.`);
  if (d.runtime) facts.push(`It runs ${d.runtime} minutes.`);
  if (d.budget && d.budget >= 1_000_000) facts.push(`It cost about $${Math.round(d.budget / 1_000_000)} million to make.`);
  if (d.topCast) facts.push(`Starring ${d.topCast}.`);
  const fact = facts.slice(0, 2).join(" ") || `You both picked ${d.title}.`;
  return `${fact} Icebreaker: what made you pick it tonight?`;
}
