import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_RECOMMENDATION_SETTINGS, recommendationSettingsSchema } from "./recommendation-settings";

export const getRankingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [role, settings] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.from("recommendation_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (role.error || settings.error) throw new Error("Could not load recommendation settings");
    return { isAdmin: role.data === true, settings: recommendationSettingsSchema.parse(settings.data ?? DEFAULT_RECOMMENDATION_SETTINGS) };
  });

export const saveRankingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => recommendationSettingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || admin !== true) throw new Error("Admin access required");
    const { error } = await context.supabase.from("recommendation_settings").upsert({ id: 1, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error("Could not save recommendation settings");
    return { ok: true };
  });