import type { Title } from "./titles";
import { DEFAULT_RECOMMENDATION_SETTINGS, type RecommendationSettings } from "./recommendation-settings";

export type TasteRating = { content_id: number; content_type: string; stars: number; genre_ids: number[] };
export const titleKey = (t: { id: number; type: string }) => `${t.type}:${t.id}`;

export function rankRecommendations(candidates: Title[], ratings: TasteRating[], settings: RecommendationSettings = DEFAULT_RECOMMENDATION_SETTINGS): Title[] {
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
    const score = taste * settings.taste_weight + quality * settings.quality_weight + Math.log1p(t.popularity ?? 0) * settings.popularity_weight;
    if (settings.hide_disliked_genres && taste < 0) return null;
    return { title: { ...t, reason: taste > 0 ? "Matches your taste" : "Popular with viewers" }, score };
  }).filter((x) => x !== null).sort((a, b) => b.score - a.score || a.title.id - b.title.id).map((x) => x.title);
}