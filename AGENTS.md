<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Kolli
- Matching, room links, ending sessions and ratings run as security-definer SQL functions (join_queue, queue_status, leave_queue, set_kosmi_room, end_match, rate_partner); keep these rules in the database so they stay atomic and can't be bypassed from the browser.
- Guests sign in anonymously and create a profiles row; all app tables are locked to participants by RLS.
- Profile reads are owner-only; lobby partner names come from match_partner_name, which verifies match membership and returns only the display name to avoid exposing another user's private profile fields.
- Account deletion runs in a server function with the admin client, scoped to the verified caller.
- Native Kolli rooms are created by the matches.room_id database default and use the existing lobby URL and match RLS; this makes room creation atomic and avoids public invitation access.
- TMDB discovery uses server functions through the linked connector; use real TMDB IDs plus media type for identity so movie and TV IDs cannot collide.
- Private title ratings use profile-scoped RLS and cascade on profile deletion; recommendations combine genre affinity, confidence-adjusted TMDB scores, related titles, and popularity while excluding rated titles.
- Chat safety is enforced by a database insert trigger with per-sender transaction locking, so direct writes cannot bypass harassment, repetition, duplicate and burst checks.
- Recommendation weights and the negative-affinity filter use shared validated settings; only server-verified roles in user_roles may change them, with RLS as a second boundary. Never assign roles from display names or client metadata.
- The public /admin shell exposes no private loader data; its inline access state and account-menu link use the existing authenticated ranking-settings function, and saves retain server role checks and RLS.
- Conduct reports use report_conduct to derive both parties from verified match membership; direct inserts are revoked and reporters can read only their own submissions.
- Permanent owner bootstrap grants the admin role only from an Auth lifecycle trigger after the configured owner email is confirmed on a non-anonymous account; the admin page uses email/password Auth, never embedded credentials.
- Moderation reports and ban changes use admin-checked SQL functions; database triggers block banned users from matching and chat, preserving enforcement against direct writes.
- Phone installation is manifest-only, with icons derived from the existing brand asset; no app-shell service worker or offline cache, so previews and returning visitors stay current.
- Share one branded loading screen between router pending state and the hydration-safe startup overlay; dismiss startup on page load and respect reduced motion.
