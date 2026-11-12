import { describe, it, expect } from "vitest";
import { rankRecommendations } from "./recommendations";
import type { Title } from "./titles";
const film = (id: number, genre: number, type: "movie" | "tv" = "movie"): Title => ({ id, type, title: `Title ${id}`, poster: "", year: "2026", rating: "8", description: "", genreIds: [genre], voteCount: 200 });
describe("personal recommendations", () => {
  it("five-star genres rank ahead of one-star genres", () => {
    const rows = [{ content_id: 100, content_type: "movie", stars: 5, genre_ids: [1] }, { content_id: 101, content_type: "movie", stars: 1, genre_ids: [2] }];
    expect(rankRecommendations([film(2, 2), film(1, 1)], rows).map((t) => t.id)).toEqual([1, 2]);
  });
  it("excludes rated titles while keeping TV and movie IDs distinct", () => {
    expect(rankRecommendations([film(1, 1), film(1, 1, "tv")], [{ content_id: 1, content_type: "movie", stars: 4, genre_ids: [1] }]).map((t) => t.type)).toEqual(["tv"]);
  });
  it("deduplicates candidates", () => {
    expect(rankRecommendations([film(1, 1), film(1, 1)], [])).toHaveLength(1);
  });
  it("uses confidence-adjusted community ratings for new users", () => {
    expect(rankRecommendations([{ ...film(1, 1), rating: "10", voteCount: 1 }, film(2, 1)], []).map((t) => t.id)).toEqual([2, 1]);
  });
});