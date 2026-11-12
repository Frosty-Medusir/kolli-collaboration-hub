import type { Title } from "./titles";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_tmdb";
type TmdbTitle = { id: number; title?: string; name?: string; media_type?: string; poster_path?: string | null; release_date?: string; first_air_date?: string; vote_average?: number; vote_count?: number; popularity?: number; overview?: string; genre_ids?: number[]; genres?: { id: number }[]; adult?: boolean };
export async function tmdbRead<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env['UDC_TMDB_API_KEY'];
  const lovableKey = process.env['LOVABLE_API_KEY'];
  if (!key || !lovableKey) throw new Error("TMDB connection is not configured");
  const url = new URL(`${GATEWAY_URL}/3/${path}`);
  for (const [k, v] of Object.entries({ language: "en-US", ...params })) url.searchParams.set(k, v);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": key, Accept: "application/json" } });
  if (!response.ok) {
    const body = await response.text();
    console.error(`TMDB failed [${response.status}]: ${body}`);
    throw new Error(`TMDB request failed [${response.status}]: ${body}`);
  }
  return await response.json() as T;
}
export function mapTitle(t: TmdbTitle, fallback?: "movie" | "tv"): Title | null {
  const type = t.media_type ?? fallback;
  if ((type !== "movie" && type !== "tv") || t.adult) return null;
  return { id: t.id, type, title: t.title ?? t.name ?? "Untitled", poster: t.poster_path ? `https://image.tmdb.org/t/p/w342${t.poster_path}` : "", year: (t.release_date ?? t.first_air_date ?? "").slice(0, 4), rating: (t.vote_average ?? 0).toFixed(1), description: t.overview ?? "", genreIds: t.genre_ids ?? t.genres?.map((g) => g.id) ?? [], voteCount: t.vote_count ?? 0, popularity: t.popularity ?? 0 };
}
export async function catalogRead(query: string, type: "both" | "movie" | "tv"): Promise<Title[]> {
  const path = query ? `search/${type === "both" ? "multi" : type}` : `trending/${type === "both" ? "all" : type}/week`;
  const data = await tmdbRead<{ results: TmdbTitle[] }>(path, query ? { query, include_adult: "false" } : {});
  return data.results.map((t) => mapTitle(t, type === "both" ? undefined : type)).filter((t): t is Title => t !== null);
}
export async function titleDetails(id: number, type: "movie" | "tv") {
  return mapTitle(await tmdbRead<TmdbTitle>(`${type}/${id}`), type);
}
export async function relatedTitles(id: number, type: "movie" | "tv") {
  const data = await tmdbRead<{ results: TmdbTitle[] }>(`${type}/${id}/recommendations`);
  return data.results.map((t) => mapTitle(t, type)).filter((t): t is Title => t !== null);
}