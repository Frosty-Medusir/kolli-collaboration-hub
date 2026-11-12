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
