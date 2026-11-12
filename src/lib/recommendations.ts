import type { Title } from "./titles";

export type TasteRating = { content_id: number; content_type: string; stars: number; genre_ids: number[] };
export const titleKey = (t: { id: number; type: string }) => `${t.type}:${t.id}`;

export function rankRecommendations(candidates: Title[], ratings: TasteRating[]): Title[] {
  const seen = new Set(ratings.map((r) => `${r.content_type}:${r.content_id}`));
  const affinity = new Map<number, number>();
  for (const r of ratings) for (const genre of r.genre_ids) {
    affinity.set(genre, (affinity.get(genre) ?? 0) + r.stars - 3);
  }
  const unique = new Map(candidates.map((t) => [titleKey(t), t]));
  return [...unique.values()].filter((t) => !seen.has(titleKey(t))).map((t) => {
    const genres = t.genreIds ?? [];
    const taste = genres.reduce((sum, g) => sum + (affinity.get(g) ?? 0), 0) / Math.max(1, genres.length);
    const votes = t.voteCount ?? 0;
    const quality = (votes * Number(t.rating) + 100 * 6.5) / (votes + 100);
    const score = taste * 2 + quality + Math.log1p(t.popularity ?? 0) * 0.15;
    return { title: { ...t, reason: taste > 0 ? "Matches your taste" : "Popular with viewers" }, score };
  }).sort((a, b) => b.score - a.score || a.title.id - b.title.id).map((x) => x.title);
}