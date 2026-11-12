import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tmdbRead } from "./tmdb.server";
import { buildIcebreaker } from "./vibes";

/** Writes one TMDB-sourced icebreaker onto a match the caller belongs to. */
export const ensureIcebreaker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ matchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: match } = await context.supabase.from("matches").select("id, icebreaker, content_id, content_type, content_title").eq("id", data.matchId).maybeSingle();
    if (!match) throw new Error("Lobby not found");
    if (match.icebreaker) return { icebreaker: match.icebreaker };
    let text: string;
    if (match.content_type === "event") {
      const { data: ev } = await context.supabase.from("live_events").select("title, description, category").eq("id", match.content_id).maybeSingle();
      text = `${ev?.description ? ev.description + " " : ""}Icebreaker: who are you rooting for in ${match.content_title}?`;
    } else {
      try {
        const type = match.content_type === "tv" ? "tv" : "movie";
        const d = await tmdbRead<{ tagline?: string; release_date?: string; first_air_date?: string; runtime?: number; number_of_seasons?: number; budget?: number; created_by?: { name: string }[]; credits?: { crew?: { job: string; name: string }[]; cast?: { name: string }[] } }>(`${type}/${match.content_id}`, { append_to_response: "credits" });
        text = buildIcebreaker({
          title: match.content_title,
          tagline: d.tagline || undefined,
          year: (d.release_date ?? d.first_air_date ?? "").slice(0, 4) || undefined,
          runtime: d.runtime || undefined,
          seasons: d.number_of_seasons || undefined,
          budget: d.budget || undefined,
          director: d.credits?.crew?.find((c) => c.job === "Director")?.name ?? d.created_by?.[0]?.name,
          topCast: d.credits?.cast?.slice(0, 2).map((c) => c.name).join(" and ") || undefined,
        });
      } catch (e) {
        console.error("Icebreaker TMDB lookup failed", e);
        text = buildIcebreaker({ title: match.content_title });
      }
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("matches").update({ icebreaker: text }).eq("id", match.id).is("icebreaker", null);
    const { data: saved } = await supabaseAdmin.from("matches").select("icebreaker").eq("id", match.id).single();
    return { icebreaker: saved?.icebreaker ?? text };
  });

async function sha256(v: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Logs the guest's IP for 24h and links the browser token; flagged browsers are silently shadow-banned. */
export const registerGuestDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().regex(/^[a-f0-9-]{36}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const ip = (getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0] ?? "unknown").trim().slice(0, 64);
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    await supabaseAdmin.from("guest_session_log").delete().lt("created_at", cutoff);
    await supabaseAdmin.from("guest_session_log").insert({ user_id: uid, ip_address: ip });
    const hash = await sha256(data.token);
    const { data: prior } = await supabaseAdmin.from("device_tokens").select("user_id, flagged").eq("token_hash", hash);
    const { data: bans } = await supabaseAdmin.from("moderation_bans").select("user_id").in("user_id", (prior ?? []).map((p) => p.user_id).filter((id) => id !== uid));
    const flagged = (prior ?? []).some((p) => p.user_id !== uid && p.flagged) || (bans ?? []).length > 0;
    await supabaseAdmin.from("device_tokens").upsert({ token_hash: hash, user_id: uid, flagged });
    if (flagged) await supabaseAdmin.from("shadow_flags").upsert({ user_id: uid, reason: "Returning browser linked to a banned or reported account" });
    return { ok: true };
  });
