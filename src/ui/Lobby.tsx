import { useState } from "react";
import { createMatch, joinMatch, getSavedServerUrl, saveServerUrl, type OnlineSession } from "./onlineLobby";

/**
 * Host/join screen for a real cross-network match. Deck selection happens once inside the
 * match itself (see game/game.ts's "deckSelect" phase, rendered by ui/Board.tsx) — this screen
 * only needs a server address and a room code (the match's boardgame.io `matchID`).
 */
export function Lobby({ onJoined, onCancel }: { onJoined: (session: OnlineSession) => void; onCancel: () => void }) {
  const [server, setServer] = useState(getSavedServerUrl());
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function commitServer(): string {
    const trimmed = server.trim().replace(/\/+$/, "");
    saveServerUrl(trimmed);
    return trimmed;
  }

  async function handleHost() {
    setError(null);
    setBusy(true);
    try {
      const url = commitServer();
      const matchID = await createMatch(url);
      const credentials = await joinMatch(url, matchID, "0", name);
      onJoined({ server: url, matchID, playerID: "0", credentials });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verbindung zum Server fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!roomCode.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const url = commitServer();
      const matchID = roomCode.trim();
      const credentials = await joinMatch(url, matchID, "1", name);
      onJoined({ server: url, matchID, playerID: "1", credentials });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beitritt fehlgeschlagen. Code und Server-Adresse prüfen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rb-menu">
      <h1>Online spielen</h1>
      <p className="rb-db-hint">
        Beide Spieler brauchen dieselbe Server-Adresse. Wer einen Raum erstellt, bekommt einen Code — den an den
        Mitspieler schicken, der tritt damit bei. Danach wählt jeder im Spiel sein eigenes gespeichertes Deck.
      </p>

      <label className="rb-menu-field">
        Server-Adresse
        <input value={server} onChange={(e) => setServer(e.target.value)} placeholder="https://dein-server.example.com" />
      </label>
      <label className="rb-menu-field">
        Dein Name (optional)
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spielername" />
      </label>

      <div className="rb-section-label" style={{ marginTop: 16 }}>
        Raum erstellen
      </div>
      <button className="rb-end-turn" onClick={handleHost} disabled={busy || !server.trim()}>
        Raum erstellen
      </button>

      <div className="rb-section-label" style={{ marginTop: 16 }}>
        Raum beitreten
      </div>
      <div className="rb-menu-start">
        <label className="rb-menu-field">
          Raum-Code
          <input value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="z.B. AbCdEfGhIjK" />
        </label>
        <button className="rb-end-turn" onClick={handleJoin} disabled={busy || !server.trim() || !roomCode.trim()}>
          Beitreten
        </button>
      </div>

      {error && <p className="rb-db-hint" style={{ color: "#e66" }}>{error}</p>}
      {busy && <p className="rb-db-hint">Verbinde…</p>}

      <button className="rb-end-turn" style={{ marginTop: 24 }} onClick={onCancel}>
        ← Menü
      </button>
    </div>
  );
}
