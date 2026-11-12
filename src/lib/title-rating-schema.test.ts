import { expect, it } from "vitest";
import { titleRatingSchema } from "./title-rating-schema";
it("title ratings accept whole stars from 1 through 5 only", () => {
  const input = { id: 27205, type: "movie" };
  expect(titleRatingSchema.safeParse({ ...input, stars: 1 }).success).toBe(true);
  expect(titleRatingSchema.safeParse({ ...input, stars: 5 }).success).toBe(true);
  for (const stars of [0, 6, 2.5]) expect(titleRatingSchema.safeParse({ ...input, stars }).success).toBe(false);
});