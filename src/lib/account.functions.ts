import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { data: matches } = await supabaseAdmin.from("matches").select("id").or(`user1.eq.${uid},user2.eq.${uid}`);
    const ids = (matches ?? []).map((m) => m.id);
    // Remember risky browsers before their history is erased, so a fresh guest account from the same browser is shadow-banned.
    const [{ count: reportsAgainst }, { data: ban }, { data: prof }] = await Promise.all([
      supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("reported_user", uid),
      supabaseAdmin.from("moderation_bans").select("user_id").eq("user_id", uid).maybeSingle(),
      supabaseAdmin.from("profiles").select("shadow_banned_until").eq("id", uid).maybeSingle(),
    ]);
    const risky = (reportsAgainst ?? 0) > 0 || !!ban || (!!prof?.shadow_banned_until && new Date(prof.shadow_banned_until) > new Date());
    if (risky) await supabaseAdmin.from("device_tokens").update({ flagged: true }).eq("user_id", uid);
    await supabaseAdmin.from("watch_requests").delete().eq("user_id", uid);
    await supabaseAdmin.from("notifications").delete().eq("user_id", uid);
    await supabaseAdmin.from("guest_session_log").delete().eq("user_id", uid);
    await supabaseAdmin.from("queue_entries").delete().eq("user_id", uid);
    await supabaseAdmin.from("ratings").delete().or(`from_user.eq.${uid},to_user.eq.${uid}`);
    await supabaseAdmin.from("reports").delete().or(`reported_by.eq.${uid},reported_user.eq.${uid}`);
    if (ids.length) await supabaseAdmin.from("matches").delete().in("id", ids);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error("Could not delete your account");
    return { ok: true };
  });
