import { z } from "zod";

export const recommendationSettingsSchema = z.object({
  taste_weight: z.number().min(0).max(5),
  quality_weight: z.number().min(0).max(5),
  popularity_weight: z.number().min(0).max(1),
  hide_disliked_genres: z.boolean(),
});
export type RecommendationSettings = z.infer<typeof recommendationSettingsSchema>;
export const DEFAULT_RECOMMENDATION_SETTINGS: RecommendationSettings = {
  taste_weight: 2, quality_weight: 1, popularity_weight: 0.15, hide_disliked_genres: true,
};