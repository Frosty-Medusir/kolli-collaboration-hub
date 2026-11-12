import { z } from "zod";
export const titleRatingSchema = z.object({ id: z.number().int().positive(), type: z.enum(["movie", "tv"]), stars: z.number().int().min(1).max(5) });