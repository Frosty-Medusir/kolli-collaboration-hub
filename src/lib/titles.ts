export type Title = {
  id: number;
  title: string;
  poster: string;
  year: string;
  rating: string;
  description: string;
  type: "movie" | "tv";
  genreIds?: number[];
  voteCount?: number;
  popularity?: number;
  reason?: string;
};

// Built-in sample titles (the original app used these when no TMDB key was set).
export const TITLES: Title[] = [
  { id: 1, title: "Breaking Bad", poster: "https://image.tmdb.org/t/p/w342/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", year: "2008", rating: "9.5", description: "A high school chemistry teacher turned methamphetamine producer...", type: "tv" },
  { id: 2, title: "The Office", poster: "https://image.tmdb.org/t/p/w342/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg", year: "2005", rating: "8.8", description: "A mockumentary on a group of typical office workers...", type: "tv" },
  { id: 3, title: "Stranger Things", poster: "https://image.tmdb.org/t/p/w342/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg", year: "2016", rating: "8.7", description: "When a young boy vanishes, a small town uncovers a mystery...", type: "tv" },
  { id: 4, title: "The Mandalorian", poster: "https://image.tmdb.org/t/p/w342/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg", year: "2019", rating: "8.7", description: "A lone gunfighter makes his way through the outer reaches...", type: "tv" },
  { id: 5, title: "Spider-Man: Into the Spider-Verse", poster: "https://image.tmdb.org/t/p/w342/iiZZdoQBEYBv6id8kYg1ZHZs76V.jpg", year: "2018", rating: "8.4", description: "Teen Miles Morales becomes Spider-Man of his reality...", type: "movie" },
];

export type TypeFilter = "both" | "movie" | "tv";

export function searchTitles(query: string, type: TypeFilter): Title[] {
  const q = query.trim().toLowerCase();
  return TITLES.filter(
    (t) =>
      (type === "both" || t.type === type) &&
      (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.year.includes(q)),
  );
}

export const DISPLAY_NAME_RE = /^[\p{L}\p{N}_ -]{3,24}$/u;

export function isKosmiUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" && (u.hostname === "kosmi.io" || u.hostname.endsWith(".kosmi.io"));
  } catch {
    return false;
  }
}
