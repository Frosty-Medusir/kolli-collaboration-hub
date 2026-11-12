import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand, Eyebrow, Footer } from "@/components/kolli/Brand";
import { JoinDialog } from "@/components/kolli/JoinDialog";
import { QueueDialog } from "@/components/kolli/QueueDialog";
import { AccountDialog } from "@/components/kolli/AccountDialog";
import { useKolliSession } from "@/hooks/use-kolli-session";
import { type Title, type TypeFilter } from "@/lib/titles";
import { cn } from "@/lib/utils";
import { catalogOptions } from "@/lib/catalog-query";
import { getRecommendations } from "@/lib/catalog.functions";
import { titleKey } from "@/lib/recommendations";
import { TitleRatingDialog } from "@/components/kolli/TitleRatingDialog";
import { InstallApp } from "@/components/kolli/InstallApp";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions()),
  head: () => ({
    meta: [
      { title: "Kolli — Watch together" },
      { name: "description", content: "Find your people, pick a movie, and make tonight a watch party with Kolli." },
      { property: "og:title", content: "Kolli — Watch together" },
      { property: "og:description", content: "Find your people, pick a movie, and make tonight a watch party with Kolli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://image.tmdb.org/t/p/w342/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg" },
      { name: "twitter:image", content: "https://image.tmdb.org/t/p/w342/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg" },
    ],
  }),
  component: Home,
});

function Home() {
  const { profile, ready, refreshProfile } = useKolliSession();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [type, setType] = useState<TypeFilter>("both");
  const [joinOpen, setJoinOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pending, setPending] = useState<Title | null>(null);
  const [queued, setQueued] = useState<Title | null>(null);
  const [view, setView] = useState<"discover" | "for-you">("discover");
  const [ratingTitle, setRatingTitle] = useState<Title | null>(null);
  const [pendingRating, setPendingRating] = useState<Title | null>(null);
  const { data: catalog } = useSuspenseQuery(catalogOptions(submitted, type));
  const recommendationFn = useServerFn(getRecommendations);
  const client = useQueryClient();
  const recommendations = useQuery({ queryKey: ["recommendations", profile?.id], queryFn: () => recommendationFn(), enabled: !!profile, staleTime: 60000 });
  const results = view === "for-you" && !submitted ? (recommendations.data?.titles ?? []).filter((t) => type === "both" || t.type === type) : catalog.titles;
  const titleRatings = new Map((recommendations.data?.ratings ?? []).map((r) => [`${r.content_type}:${r.content_id}`, r.stars]));

  function openRating(t: Title) {
    if (!profile) { setPendingRating(t); setJoinOpen(true); return; }
    setRatingTitle(t);
  }

  function pick(t: Title) {
    if (!profile) { setPending(t); setJoinOpen(true); return; }
    setQueued(t);
  }

  return (
    <div className="min-h-screen">
      <header className="flex h-20 items-center justify-between border-b border-foreground/10 px-[7%]">
        <div className="flex items-center gap-10">
          <Brand />
          <nav className="hidden gap-9 text-sm text-muted-foreground md:flex">
            <a href="#discover" className="text-foreground">Discover</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <InstallApp />
          <span className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            <span className="size-2 rounded-full bg-success" /> Your next watch buddy is out there
          </span>
          {ready && (profile ? (
            <button onClick={() => setAccountOpen(true)} className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm" aria-label="Account and privacy">
              <span className="grid size-7 place-items-center rounded-full bg-accent font-bold text-accent-foreground">{profile.username[0]?.toUpperCase()}</span>
              {profile.username} <span aria-hidden>⚙</span>
            </button>
          ) : (
            <Button size="sm" onClick={() => setJoinOpen(true)}>Join to match ↗</Button>
          ))}
        </div>
      </header>

      <main>
        <section id="discover" className="relative grid items-center gap-12 px-[7%] py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <Eyebrow>GOOD MOVIES. BETTER COMPANY.</Eyebrow>
            <h1 className="mt-6 font-display text-6xl font-extrabold leading-[0.95] tracking-tighter sm:text-7xl">
              Find your<br />people.<br /><span className="font-serif font-normal italic text-accent">Press play.</span>
            </h1>
            <p className="mt-6 max-w-md text-muted-foreground">The best part of watching is having someone to watch with. Find your kind of movie person and make a night of it.</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(query); document.getElementById("picks")?.scrollIntoView(); }} className="mt-8 flex max-w-xl items-center gap-2 rounded-md border bg-card p-2 shadow-sm">
              <span className="pl-2 text-muted-foreground" aria-hidden>⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Search a movie or show..." aria-label="Search movies and shows" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
              <Button type="submit" variant="destructive">Search ↗</Button>
            </form>
            <div className="mt-4 flex gap-1" role="group" aria-label="Search type">
              {(["both", "movie", "tv"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)} className={cn("rounded px-3 py-1.5 text-xs", type === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
                  {t === "both" ? "Everything" : t === "movie" ? "Movies" : "TV shows"}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mx-auto h-[420px] w-full max-w-md" aria-label="Featured movies">
            <img src="https://image.tmdb.org/t/p/w342/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg" alt="Stranger Things" className="absolute right-4 top-0 w-52 rotate-6 rounded-md shadow-xl" />
            <div className="absolute bottom-0 left-4 w-60 -rotate-3 overflow-hidden rounded-md shadow-2xl">
              <img src="https://image.tmdb.org/t/p/w342/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg" alt="The Office" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-panel to-transparent p-4 text-ink-panel-foreground">
                <span className="text-[9px] font-bold tracking-widest text-star">TONIGHT'S PICK</span>
                <strong className="mt-1 block font-display text-lg leading-tight">Make it a<br />movie night.</strong>
              </div>
            </div>
            <div className="absolute left-0 top-10 flex items-center gap-2 rounded-md bg-card px-3 py-2 text-xs shadow-lg">
              <span className="text-accent">✳</span><span><strong className="block">Same taste?</strong><small className="text-muted-foreground">Meet your match.</small></span>
            </div>
          </div>
        </section>

        <section id="picks" className="px-[7%] py-16">
          <Eyebrow>A LITTLE INSPIRATION</Eyebrow>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight">
                {submitted ? <>Results for “{submitted}”</> : view === "for-you" ? <>Picked for <span className="font-serif font-normal italic text-accent">you.</span></> : <>Something good is <span className="font-serif font-normal italic text-accent">on.</span></>}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">Pick a title. We’ll find someone who loves it too.</p>
            </div>
            {submitted && <button className="text-sm font-semibold" onClick={() => { setSubmitted(""); setQuery(""); }}>Explore all ↗</button>}
          </div>
          <div className="mt-6 flex gap-2" role="group" aria-label="Discovery view">
            <Button variant={view === "discover" ? "default" : "outline"} size="sm" onClick={() => setView("discover")}>Trending</Button>
            <Button variant={view === "for-you" ? "default" : "outline"} size="sm" onClick={() => { setView("for-you"); setSubmitted(""); setQuery(""); }}>For you</Button>
          </div>
          {view === "for-you" && !profile ? <div className="py-10"><Button onClick={() => setJoinOpen(true)}>Join for personal recommendations ↗</Button></div> : view === "for-you" && recommendations.isPending ? <div className="flex items-center gap-2 py-10 text-muted-foreground"><LoaderCircle className="size-5 animate-spin" />Finding your picks…</div> : catalog.error || (view === "for-you" && recommendations.error) ? <div className="py-10 text-destructive"><p>{catalog.error ?? recommendations.error?.message}</p><Button variant="outline" className="mt-3" onClick={() => { void client.invalidateQueries({ queryKey: ["catalog"] }); void recommendations.refetch(); }}>Try again</Button></div> : results.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <h3 className="font-display text-lg font-semibold text-foreground">No titles found just yet</h3>
              <p className="text-sm">Try another title, or search for a movie or show you already love.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {results.map((t) => (
                <article key={titleKey(t)} className="group min-w-0 text-left">
                  <Button variant="ghost" onClick={() => pick(t)} aria-label={`Find a match for ${t.title}`} className="block h-auto w-full p-0 hover:bg-transparent">
                  <div className="relative isolate overflow-hidden rounded-md bg-muted">
                    <img src={t.poster} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="relative z-10 aspect-[2/3] w-full object-cover transition-transform group-hover:scale-105" />
                    <span className="absolute inset-0 -z-0 grid place-items-center p-4 text-center font-display text-sm font-bold text-muted-foreground">{t.title}</span>
                    <span className="absolute left-2 top-2 z-20 rounded bg-ink-panel/85 px-2 py-1 text-[10px] font-bold text-ink-panel-foreground"><span className="text-star">★</span> {t.rating} <span className="font-normal">TMDB</span></span>
                  </div>
                  </Button>
                  <p className="mt-3 truncate font-display text-sm font-semibold">{t.title}</p>
                  <p className="flex justify-between text-[11px] text-muted-foreground"><span>{t.year}</span><span>{t.type === "tv" ? "TV" : "Movie"}</span></p>
                  {t.reason && view === "for-you" && <p className="mt-1 text-[11px] text-muted-foreground">{t.reason}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 px-0 text-[11px] text-accent" onClick={() => pick(t)}>Find a match ↗</Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" aria-label={`Rate ${t.title}`} onClick={() => openRating(t)}><Star className="size-3 text-star" />{titleRatings.get(titleKey(t)) ? `${titleRatings.get(titleKey(t))}/5` : "Rate"}</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="mt-8 text-xs text-muted-foreground"><a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="font-semibold underline">TMDB</a> · This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </section>

        <section id="how-it-works" className="grid items-center gap-10 bg-muted px-[7%] py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>IT'S A VERY GOOD PLAN</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">From “what should we watch?” to <span className="font-serif font-normal italic text-accent">“that was fun.”</span></h2>
            <p className="mt-4 text-sm text-muted-foreground">Skip the group chat logistics. Kolli brings movie people together, one great pick at a time.</p>
            <Button className="mt-6" onClick={() => (profile ? document.getElementById("picks")?.scrollIntoView() : setJoinOpen(true))}>Find your people ↗</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[["01", "⌕", "Pick your pick", "Choose the film or show you’re in the mood for."], ["02", "✳", "Meet your match", "We’ll find someone who wants to watch it, too."], ["03", "▷", "Make it a night", "Say hello, share a Kosmi room, and watch together."]].map(([n, i, h, p]) => (
              <article key={n} className="relative min-h-44 rounded border bg-background p-5">
                <span className="absolute right-4 top-4 text-[10px] tracking-widest text-muted-foreground">{n}</span>
                <span className="grid size-9 place-items-center rounded-full bg-accent/10 text-accent">{i}</span>
                <h3 className="mt-6 font-display text-sm font-bold">{h}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />

      <JoinDialog open={joinOpen} onOpenChange={setJoinOpen} onJoined={async () => { await refreshProfile(); if (pending) { setQueued(pending); setPending(null); } if (pendingRating) { setRatingTitle(pendingRating); setPendingRating(null); } }} />
      <TitleRatingDialog title={ratingTitle} current={ratingTitle ? titleRatings.get(titleKey(ratingTitle)) ?? 0 : 0} onClose={() => setRatingTitle(null)} onSaved={() => { void client.invalidateQueries({ queryKey: ["recommendations"] }); }} />
      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} profile={profile} />
      <QueueDialog title={queued} onClose={() => setQueued(null)} />
    </div>
  );
}
