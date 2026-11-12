import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Brand, Eyebrow } from "@/components/kolli/Brand";
import { RankingControls } from "@/components/kolli/RankingControls";
import { Button } from "@/components/ui/button";
import { useKolliSession } from "@/hooks/use-kolli-session";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Admin — Kolli" },
    { name: "description", content: "Kolli administration and recommendation ranking settings." },
    { property: "og:title", content: "Admin — Kolli" },
    { property: "og:description", content: "Kolli administration and recommendation ranking settings." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminPage,
});

function AdminPage() {
  const { userId, profile, ready } = useKolliSession();
  return <div className="min-h-screen">
    <header className="flex h-20 items-center justify-between gap-4 border-b px-[7%]">
      <Brand />
      <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="size-4" />Back to Kolli</Link></Button>
    </header>
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <Eyebrow>KOLLI ADMINISTRATION</Eyebrow>
      <div className="mb-10 mt-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 font-display text-4xl font-bold"><ShieldCheck className="size-8 text-accent" />Admin</h1>
        {profile && <span className="text-sm text-muted-foreground">{profile.username}</span>}
      </div>
      {!ready ? <p role="status" className="text-muted-foreground">Loading account…</p> : userId ? <RankingControls key={userId} userId={userId} page /> : <section className="border-y py-8">
        <h2 className="font-display text-xl font-bold">Sign in required</h2>
        <p className="mt-2 text-sm text-muted-foreground">Join Kolli with your authorized admin account to continue.</p>
        <Button asChild className="mt-5"><Link to="/">Go to Kolli</Link></Button>
      </section>}
    </main>
  </div>;
}