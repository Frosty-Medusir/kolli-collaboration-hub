import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { catalogRead, relatedTitles, titleDetails } from "./tmdb.server";
import { rankRecommendations } from "./recommendations";
import { titleRatingSchema } from "./title-rating-schema";

export const getCatalog = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ query: z.string().trim().max(100), type: z.enum(["both", "movie", "tv"]) }).parse(data))
  .handler(async ({ data }) => {
    try { return { titles: await catalogRead(data.query, data.type), error: null }; }
    catch (error) { return { titles: [], error: error instanceof Error ? error.message : "TMDB unavailable" }; }
  });

export const getRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ratings, error } = await context.supabase.from("title_ratings").select("*").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = ratings ?? [];
    const seeds = rows.filter((r) => r.stars >= 4).slice(0, 3);
    const trending = await catalogRead("", "both");
    const related = await Promise.all(seeds.map((r) => relatedTitles(r.content_id, r.content_type === "tv" ? "tv" : "movie")));
    return { titles: rankRecommendations([...related.flat(), ...trending], rows).slice(0, 20), ratings: rows };
  });

export const rateTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => titleRatingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const title = await titleDetails(data.id, data.type);
    if (!title) throw new Error("Title not available");
    const { error } = await context.supabase.from("title_ratings").upsert({ user_id: context.userId, content_id: title.id, content_type: title.type, content_title: title.title, genre_ids: title.genreIds ?? [], stars: data.stars, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });