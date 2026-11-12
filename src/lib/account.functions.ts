import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { data: matches } = await supabaseAdmin.from("matches").select("id").or(`user1.eq.${uid},user2.eq.${uid}`);
    const ids = (matches ?? []).map((m) => m.id);
    await supabaseAdmin.from("queue_entries").delete().eq("user_id", uid);
    await supabaseAdmin.from("ratings").delete().or(`from_user.eq.${uid},to_user.eq.${uid}`);
    await supabaseAdmin.from("reports").delete().or(`reported_by.eq.${uid},reported_user.eq.${uid}`);
    if (ids.length) await supabaseAdmin.from("matches").delete().in("id", ids);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error("Could not delete your account");
    return { ok: true };
  });
