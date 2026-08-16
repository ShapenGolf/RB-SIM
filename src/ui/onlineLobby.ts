/**
 * Thin wrapper around the boardgame.io server's Lobby REST API (see server/index.ts) — creating
 * and joining a match, which hands back the `playerCredentials` the SocketIO transport needs to
 * make moves as that seat (see OnlineGame.tsx). Deck selection happens later, inside the match
 * itself (game/game.ts's "deckSelect" phase) — the lobby only needs a server address and a room
 * code.
 */

export interface OnlineSession {
  server: string;
  matchID: string;
  playerID: "0" | "1";
  credentials: string;
}

const STORAGE_KEY = "rb-sim-online-session";

async function parseErrorMessage(res: Response): Promise<string> {
  // The Lobby API returns JSON error bodies for some failures (e.g. `{"error": "..."}`) and
  // plain text for others (e.g. koa-body validation messages) — try both before giving up.
  const text = await res.text().catch(() => "");
  try {
    const body = JSON.parse(text);
    if (typeof body?.error === "string") return body.error;
  } catch {
    // not JSON — fall through to the raw text below
  }
  return text || `Server antwortete mit ${res.status}`;
}

export async function createMatch(server: string): Promise<string> {
  const res = await fetch(`${server}/games/riftbound/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numPlayers: 2 }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const data = (await res.json()) as { matchID: string };
  return data.matchID;
}

export async function joinMatch(
  server: string,
  matchID: string,
  playerID: "0" | "1",
  playerName: string,
): Promise<string> {
  const res = await fetch(`${server}/games/riftbound/${encodeURIComponent(matchID)}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The server's Lobby API requires a non-empty playerName (see server/index.ts) — fall back
    // to a generic one instead of exposing that as a confusing "required field" to the player.
    body: JSON.stringify({ playerID, playerName: playerName.trim() || `Spieler ${Number(playerID) + 1}` }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const data = (await res.json()) as { playerCredentials: string };
  return data.playerCredentials;
}

/** Best-effort — the match keeps running for the other player either way, this just frees the seat's name/credentials. */
export async function leaveMatch(session: OnlineSession): Promise<void> {
  try {
    await fetch(`${session.server}/games/riftbound/${encodeURIComponent(session.matchID)}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerID: session.playerID, credentials: session.credentials }),
    });
  } catch {
    // best-effort only — ignore network errors on the way out
  }
}

export function saveOnlineSession(session: OnlineSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadOnlineSession(): OnlineSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnlineSession;
  } catch {
    return null;
  }
}

export function clearOnlineSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

const SERVER_URL_KEY = "rb-sim-server-url";

export function getSavedServerUrl(): string {
  return localStorage.getItem(SERVER_URL_KEY) ?? (import.meta.env.VITE_SERVER_URL as string | undefined) ?? "http://localhost:8000";
}

export function saveServerUrl(url: string): void {
  localStorage.setItem(SERVER_URL_KEY, url);
}
