export function roomInviteUrl(origin: string, matchId: string): string {
  return new URL(`/lobby/${encodeURIComponent(matchId)}`, origin).href;
}