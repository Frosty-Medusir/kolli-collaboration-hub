import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Brand, Eyebrow } from "@/components/kolli/Brand";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useKolliSession } from "@/hooks/use-kolli-session";
import { isKosmiUrl } from "@/lib/titles";
import { cn } from "@/lib/utils";
import { Copy, LockKeyhole } from "lucide-react";
import { roomInviteUrl } from "@/lib/rooms";

export const Route = createFileRoute("/lobby/$matchId")({
  head: () => ({
    meta: [
      { title: "Your watch party lobby — Kolli" },
      { name: "description", content: "Chat with your match, share a Kosmi room, and watch together." },
      { property: "og:title", content: "Your watch party lobby — Kolli" },
      { property: "og:description", content: "Chat with your match, share a Kosmi room, and watch together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lobby,
});

type Match = Tables<"matches">;
type Message = Tables<"messages">;
const REASONS = [["inappropriate-behavior", "Inappropriate behavior"], ["harassment", "Harassment"], ["spam", "Spam"], ["fake-profile", "Fake profile"], ["other", "Other"]] as const;

function Lobby() {
  const { matchId } = Route.useParams();
  const navigate = useNavigate();
  const { userId, profile, ready } = useKolliSession();
  const [match, setMatch] = useState<Match | null>(null);
  const [partnerName, setPartnerName] = useState("your match");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [room, setRoom] = useState("");
  const [missing, setMissing] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const partnerId = match && userId ? (match.user1 === userId ? match.user2 : match.user1) : null;

  useEffect(() => {
    if (!ready || !userId) return;
    let alive = true;
    (async () => {
      const { data: m } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
      if (!alive) return;
      if (!m) return setMissing(true);
      setMatch(m);
      setRoom(m.kosmi_room_url ?? "");
      const other = m.user1 === userId ? m.user2 : m.user1;
      const { data: p } = await supabase.from("profiles").select("username").eq("id", other).maybeSingle();
      if (p && alive) setPartnerName(p.username);
      const { data: msgs } = await supabase.from("messages").select("*").eq("match_id", matchId).order("created_at").limit(200);
      if (alive) setMessages(msgs ?? []);
    })();
    const channel = supabase
      .channel(`lobby-${matchId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, (payload) => {
        const m = payload.new as Match;
        setMatch(m);
        setRoom(m.kosmi_room_url ?? "");
      })
      .subscribe();
    // Fallback refresh so room link and session status stay in sync even if a live update is missed.
    const poll = setInterval(async () => {
      const { data: m } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
      if (m && alive) setMatch((prev) => {
        if (prev && prev.kosmi_room_url === m.kosmi_room_url && prev.status === m.status) return prev;
        setRoom(m.kosmi_room_url ?? "");
        return m;
      });
    }, 4000);
    return () => { alive = false; clearInterval(poll); supabase.removeChannel(channel); };
  }, [ready, userId, matchId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !userId || !profile) return;
    setText("");
    const { data, error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: userId, sender_name: profile.username, body: body.slice(0, 1000) }).select().single();
    if (error) return void toast.error("Message not sent");
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  }

  async function saveRoom(e: React.FormEvent) {
    e.preventDefault();
    if (room.trim() && !isKosmiUrl(room)) return void toast.error("Room link must be an HTTPS link hosted on kosmi.io");
    const { error } = await supabase.rpc("set_kosmi_room", { p_match: matchId, p_url: room.trim() });
    if (error) return void toast.error(error.message);
    setMatch((m) => (m ? { ...m, kosmi_room_url: room.trim() || null } : m));
    toast.success(room.trim() ? "Room shared with your match" : "Room link removed");
  }

  async function finish() {
    const { error } = await supabase.rpc("end_match", { p_match: matchId });
    if (error) return void toast.error("Could not end the session");
    setMatch((m) => (m ? { ...m, status: "ended" } : m));
  }

  async function copyRoom() {
    try {
      await navigator.clipboard.writeText(roomInviteUrl(window.location.origin, matchId));
      toast.success("Kolli room link copied");
    } catch {
      toast.error("Could not copy the room link");
    }
  }

  if (ready && !userId) return <Centered title="Join Kolli first" body="Sign in as a guest from the home page to see your lobby." />;
  if (missing) return <Centered title="Lobby not found" body="This watch party has expired or isn't yours." />;
  if (!match) return <Centered title="Loading your lobby…" body="" />;

  const ended = match.status !== "active";

  return (
    <div className="min-h-screen">
      <header className="flex h-20 items-center justify-between border-b border-foreground/10 px-[7%]">
        <Brand />
        {!ended && <Button variant="outline" size="sm" onClick={finish}>Finish watch party</Button>}
      </header>
      <main className="grid gap-6 px-[7%] py-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <Eyebrow>{ended ? "WATCH PARTY ENDED" : "YOU'RE MATCHED"}</Eyebrow>
          <div className="mt-4 flex items-center gap-4">
            {match.poster_url && <img src={match.poster_url} alt="" className="h-24 w-16 rounded object-cover" />}
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">{match.content_title}</h1>
              <p className="text-sm text-muted-foreground">with <strong className="text-foreground">{partnerName}</strong></p>
            </div>
          </div>

          {ended ? (
            <AfterParty matchId={matchId} partnerId={partnerId} partnerName={partnerName} onDone={() => navigate({ to: "/" })} />
          ) : (
            <>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y py-5">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold"><LockKeyhole className="size-4 text-accent" />Kolli room</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Room {match.room_id.slice(0, 8)} · You and {partnerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Created automatically · Private to this match</p>
                </div>
                <Button variant="outline" onClick={copyRoom}><Copy className="size-4" />Copy room link</Button>
              </div>
              <form onSubmit={saveRoom} className="mt-6 border-b pb-5">
                <label className="text-sm font-semibold" htmlFor="kosmi">Kosmi room invite link</label>
                <p className="mb-3 text-xs text-muted-foreground">Optional for video: <a className="underline" href="https://app.kosmi.io" target="_blank" rel="noreferrer">open Kosmi ↗</a></p>
                <div className="flex gap-2">
                  <Input id="kosmi" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="https://app.kosmi.io/room/..." className="bg-background" />
                  <Button type="submit">Share</Button>
                </div>
              </form>
              {match.kosmi_room_url && (
                <div className="mt-4 overflow-hidden rounded-md border bg-ink-panel">
                  <iframe src={match.kosmi_room_url} title="Kosmi room" className="aspect-video w-full" allow="autoplay; fullscreen; microphone; camera; display-capture" />
                  <a href={match.kosmi_room_url} target="_blank" rel="noreferrer" className="block p-3 text-center text-xs text-ink-panel-foreground underline">Room not loading? Open it in a new tab ↗</a>
                </div>
              )}
            </>
          )}
        </section>

        <section className="flex h-[560px] flex-col rounded-md border bg-card">
          <div className="border-b p-4 font-display text-sm font-bold">Chat</div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.length === 0 && <p className="text-center text-xs text-muted-foreground">Say hello to {partnerName} 👋</p>}
            {messages.map((m) => (
              <div key={m.id} className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", m.sender_id === userId ? "ml-auto bg-foreground text-background" : "bg-muted")}>
                {m.sender_id !== userId && <span className="block text-[10px] font-bold text-accent">{m.sender_name}</span>}
                {m.body}
              </div>
            ))}
            <div ref={bottom} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-3">
            <Input value={text} onChange={(e) => setText(e.target.value)} disabled={ended} placeholder={ended ? "Chat closed" : "Type a message…"} maxLength={1000} className="bg-background" aria-label="Message" />
            <Button type="submit" disabled={ended || !text.trim()}>Send</Button>
          </form>
        </section>
      </main>
    </div>
  );
}

function AfterParty({ matchId, partnerId, partnerName, onDone }: { matchId: string; partnerId: string | null; partnerName: string; onDone: () => void }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [rated, setRated] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<string>("inappropriate-behavior");
  const [details, setDetails] = useState("");

  async function rate(e: React.FormEvent) {
    e.preventDefault();
    if (!stars) return void toast.error("Pick 1 to 5 stars");
    const { error } = await supabase.rpc("rate_partner", { p_match: matchId, p_stars: stars, p_comment: comment });
    if (error) return void toast.error(error.message);
    setRated(true);
    toast.success("Thanks for rating!");
  }

  async function report(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return void toast.error("Join Kolli before sending a report");
    const { error } = await supabase.from("reports").insert({ reported_user: partnerId, reported_by: user.id, match_id: matchId, reason, description: details.slice(0, 1000) || null });
    if (error) return void toast.error("Could not send report");
    setReporting(false);
    toast.success("Report sent. Thank you for keeping Kolli safe.");
  }

  return (
    <div className="mt-8 grid gap-4">
      {rated ? (
        <div className="rounded-md border bg-card p-5">
          <h2 className="font-display text-xl font-bold">That was fun.</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ready for another one?</p>
          <Button className="mt-4" onClick={onDone}>Find another match ↗</Button>
        </div>
      ) : (
        <form onSubmit={rate} className="rounded-md border bg-card p-5">
          <h2 className="font-display text-xl font-bold">How was watching with {partnerName}?</h2>
          <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setStars(n)} className={cn("text-3xl", n <= stars ? "text-star" : "text-border")}>★</button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} placeholder="Optional comment" className="mt-3 bg-background" />
          <div className="mt-3 flex gap-2">
            <Button type="submit">Submit rating</Button>
            <Button type="button" variant="ghost" onClick={onDone}>Skip</Button>
          </div>
        </form>
      )}
      {reporting ? (
        <form onSubmit={report} className="rounded-md border bg-card p-5">
          <h3 className="font-display font-bold">Report {partnerName}</h3>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-3 w-full rounded-md border bg-background p-2 text-sm" aria-label="Reason">
            {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="What happened? (optional)" className="mt-2 bg-background" />
          <Button type="submit" variant="destructive" className="mt-3">Send report</Button>
        </form>
      ) : (
        <button onClick={() => setReporting(true)} className="text-left text-xs text-muted-foreground underline">Something wrong? Report this person</button>
      )}
    </div>
  );
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {body && <p className="mt-2 text-sm text-muted-foreground">{body}</p>}
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-accent">Back to Kolli ↗</Link>
      </div>
    </div>
  );
}
