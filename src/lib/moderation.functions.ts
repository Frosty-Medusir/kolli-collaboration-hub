import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { banActionSchema, reportActionSchema, moderationDashboardSchema } from "./moderation-schema";

export const getModerationDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("admin_moderation_dashboard");
    if (error) throw new Error(error.message);
    return moderationDashboardSchema.parse(data);
  });

export const setUserBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => banActionSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("admin_set_user_ban", { p_user: data.userId, p_banned: data.banned, p_reason: data.reason });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resolveConductReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => reportActionSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("admin_resolve_report", { p_report: data.reportId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });