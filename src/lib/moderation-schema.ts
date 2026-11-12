import { z } from "zod";

export const banActionSchema = z.object({
  userId: z.string().uuid(),
  banned: z.boolean(),
  reason: z.string().trim().max(500),
}).refine((value) => !value.banned || value.reason.length >= 3, { message: "Enter a ban reason" });
export const reportActionSchema = z.object({ reportId: z.string().uuid() });
export const moderationDashboardSchema = z.object({
  reports: z.array(z.object({ id: z.string(), reported_user: z.string(), reported_name: z.string(), reporter_name: z.string(), reason: z.string(), description: z.string().nullable(), status: z.string(), created_at: z.string(), resolved_at: z.string().nullable(), banned: z.boolean() })),
  bans: z.array(z.object({ user_id: z.string(), username: z.string(), reason: z.string(), banned_at: z.string() })),
});