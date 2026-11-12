import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROMPT = `You moderate a 1:1 chat between strangers watching a movie together. Flag the message if it contains harassment, insults, threats, hate, sexual content or advances, doxxing or requests for personal contact info, self-harm encouragement, scams, or promotional spam (ads, link-dropping, solicitation) — including when disguised with misspellings, spacing, symbols, other languages, code words, euphemisms or sarcasm. Normal friendly chat, mild swearing about the movie, spoilers, and short or repetitive but harmless lines are fine (flooding is handled separately). Use the recent conversation for context.`;

async function aiVerdict(history: string[], body: string): Promise<{ flagged: boolean; reason: string }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("unavailable");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra", stream: true, store: false,
      reasoning: { effort: "low" },
      instructions: PROMPT,
      input: `Recent conversation:\n${history.join("\n") || "(none)"}\n\nNew message to judge:\n<<<${body}>>>`,
      text: { format: { type: "json_schema", name: "verdict", strict: true, schema: { type: "object", additionalProperties: false, required: ["flagged", "reason"], properties: { flagged: { type: "boolean" }, reason: { type: "string" } } } } },
    }),
  });
  if (!res.ok || !res.body) throw new Error("unavailable");
  const reader = res.body.getReader(); const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop() ?? "";
    for (const l of lines) {
      if (!l.startsWith("data:")) continue;
      try { const ev = JSON.parse(l.slice(5)); if (ev.type === "response.output_text.delta") out += ev.delta; if (ev.type === "response.failed" || ev.type === "error") throw new Error("unavailable"); } catch (e) { if ((e as Error).message === "unavailable") throw e; }
    }
  }
  const v = JSON.parse(out);
  return { flagged: v.flagged === true, reason: String(v.reason ?? "") };
}

/** AI-checks a chat message and issues a one-time approval the database requires before insert. Fails closed. */
export const approveChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ matchId: z.string().uuid(), body: z.string().trim().min(1).max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: match } = await context.supabase.from("matches").select("id,user1,user2,status").eq("id", data.matchId).maybeSingle();
    if (!match || ![match.user1, match.user2].includes(context.userId) || match.status !== "active") return { ok: false as const, error: "Chat closed or access denied." };
    const { data: rule } = await context.supabase.rpc("chat_content_violation", { p_body: data.body });
    if (rule) return { ok: false as const, error: String(rule) };
    const { data: recent } = await context.supabase.from("messages").select("sender_id,body").eq("match_id", data.matchId).order("created_at", { ascending: false }).limit(8);
    const history = (recent ?? []).reverse().map((m) => `${m.sender_id === context.userId ? "Sender" : "Partner"}: ${m.body}`);
    let verdict;
    try { verdict = await aiVerdict(history, data.body); } catch { return { ok: false as const, error: "Safety check unavailable: message not sent. Try again shortly." }; }
    if (verdict.flagged) return { ok: false as const, error: "Harassment or unsafe content: message blocked." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("chat_approvals").insert({ sender_id: context.userId, match_id: data.matchId, body: data.body }).select("id").single();
    if (error || !row) return { ok: false as const, error: "Message not sent. Please try again." };
    return { ok: true as const, approvalId: row.id, body: data.body };
  });
