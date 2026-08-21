import { useMemo, useState } from "react";
import { validateDeck } from "../cards/deckValidation";
import { listSavedDecks, type SavedDeck } from "../decks/store";
import type { SetupOptions } from "../game/setup";
import type { BotTier } from "../ai/bots";
import type { PlayerId } from "../game/state";

const BOT_TIER_LABELS: Record<BotTier, string> = { easy: "Leicht", medium: "Mittel", hard: "Schwer" };

/**
 * Home screen. Deck building + picking who starts is fully wired to a real local (same-screen)
 * game. Networked host/join with a shareable room code (see ui/Lobby.tsx, ui/OnlineGame.tsx,
 * server/index.ts) needs each player's own deck too, but that's picked once inside the match
 * itself (game/game.ts's "deckSelect" phase) rather than here, since the two browsers don't
 * share localStorage.
 *
 * Battlefield selection happens in-game, right after "Spiel starten" (see game/game.ts's
 * "battlefieldSelect" phase and ui/Board.tsx) — not here. `battlefieldCardIds` below is just a
 * placeholder default: the phase overwrites both slots as soon as each player picks from their
 * own submitted pool, so it doesn't matter which of a deck's 3 Battlefields it is.
 */
export function Menu({
  onOpenDeckBuilder,
  onStartGame,
  onStartBotGame,
  onOpenLobby,
}: {
  onOpenDeckBuilder: () => void;
  onStartGame: (options: SetupOptions) => void;
  onStartBotGame: (options: SetupOptions, humanPlayerId: PlayerId, botPlayerId: PlayerId, tier: BotTier) => void;
  onOpenLobby: () => void;
}) {
  const savedDecks = useMemo(() => listSavedDecks(), []);
  const legalDecks = useMemo(() => savedDecks.filter((d) => validateDeck(d.deck).length === 0), [savedDecks]);

  const [mode, setMode] = useState<"human" | "bot">("human");
  const [deckAId, setDeckAId] = useState("");
  const [deckBId, setDeckBId] = useState("");
  const [starter, setStarter] = useState<"A" | "B">("A");
  const [botTier, setBotTier] = useState<BotTier>("easy");

  function findDeck(id: string): SavedDeck | undefined {
    return legalDecks.find((d) => d.id === id);
  }

  function buildSetupOptions(deckA: SavedDeck, deckB: SavedDeck) {
    // Slot "0" always goes first mechanically (see game/turnFlow.ts's second-player Channel
    // bonus, hardcoded to player "1") — "who starts" just decides which chosen deck fills slot 0.
    const firstDeck = starter === "A" ? deckA : deckB;
    const secondDeck = starter === "A" ? deckB : deckA;
    const battlefieldCardIds: [string, string] = [firstDeck.deck.battlefields[0], secondDeck.deck.battlefields[0]];
    const options: SetupOptions = {
      player0Domains: [],
      player1Domains: [],
      battlefieldCardIds,
      player0Deck: firstDeck.deck,
      player1Deck: secondDeck.deck,
    };
    return options;
  }

  function handleStart() {
    const deckA = findDeck(deckAId);
    const deckB = findDeck(deckBId);
    if (!deckA || !deckB) return;
    onStartGame(buildSetupOptions(deckA, deckB));
  }

  function handleStartVsBot() {
    const deckA = findDeck(deckAId);
    const deckB = findDeck(deckBId);
    if (!deckA || !deckB) return;
    const humanPlayerId: PlayerId = starter === "A" ? "0" : "1";
    const botPlayerId: PlayerId = humanPlayerId === "0" ? "1" : "0";
    onStartBotGame(buildSetupOptions(deckA, deckB), humanPlayerId, botPlayerId, botTier);
  }

  return (
    <div className="rb-menu">
      <h1>Riftbound Simulator</h1>
      <button className="rb-end-turn" onClick={onOpenDeckBuilder}>
        Deckbuilder öffnen
      </button>
      <button className="rb-end-turn" style={{ marginLeft: 8 }} onClick={onOpenLobby}>
        Online spielen
      </button>

      <div className="rb-section-label" style={{ marginTop: 24 }}>
        {mode === "human" ? "Lokales Spiel starten" : "Gegen Bot spielen"}
      </div>
      <div className="rb-menu-start" style={{ marginBottom: 8 }}>
        <button className={mode === "human" ? "rb-end-turn" : "rb-mode-toggle"} onClick={() => setMode("human")}>
          Gegen Mitspieler
        </button>
        <button className={mode === "bot" ? "rb-end-turn" : "rb-mode-toggle"} onClick={() => setMode("bot")}>
          Gegen Bot
        </button>
      </div>
      <p className="rb-db-hint">
        {mode === "human"
          ? 'Zwei legale, gespeicherte Decks nötig — beide werden hier ausgewählt, ihr spielt auf demselben Bildschirm. Nach dem Start wählt jeder Spieler noch, welches seiner 3 Battlefields mit an den Tisch kommt. Für ein Spiel von zwei Orten aus: "Online spielen" oben.'
          : "Der Bot spielt regelkonform, kennt aber nie den Inhalt deiner Hand, deines Decks oder seines eigenen Decks im Voraus — er plant nur mit dem, was auf dem Tisch sichtbar ist. Wähle dein Deck, ein Deck für den Bot und eine Schwierigkeitsstufe."}
      </p>

      {legalDecks.length < (mode === "human" ? 2 : 1) ? (
        <p className="rb-db-hint">
          Baue mindestens {mode === "human" ? 2 : 1} legale{mode === "human" ? "" : "s"} Deck{mode === "human" ? "s" : ""} im
          Deckbuilder, um {mode === "human" ? "ein Spiel" : "gegen einen Bot"} zu starten.
        </p>
      ) : (
        <div className="rb-menu-start">
          <label className="rb-menu-field">
            {mode === "human" ? "Deck Spieler A" : "Dein Deck"}
            <select value={deckAId} onChange={(e) => setDeckAId(e.target.value)}>
              <option value="">— wählen —</option>
              {legalDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="rb-menu-field">
            {mode === "human" ? "Deck Spieler B" : "Bot-Deck"}
            <select value={deckBId} onChange={(e) => setDeckBId(e.target.value)}>
              <option value="">— wählen —</option>
              {legalDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="rb-menu-field">
            Wer beginnt?
            <select value={starter} onChange={(e) => setStarter(e.target.value as "A" | "B")}>
              <option value="A">{mode === "human" ? "Spieler A" : "Du"}</option>
              <option value="B">{mode === "human" ? "Spieler B" : "Bot"}</option>
            </select>
          </label>
          {mode === "bot" && (
            <label className="rb-menu-field">
              Schwierigkeit
              <select value={botTier} onChange={(e) => setBotTier(e.target.value as BotTier)}>
                {(Object.keys(BOT_TIER_LABELS) as BotTier[]).map((tier) => (
                  <option key={tier} value={tier}>
                    {BOT_TIER_LABELS[tier]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {mode === "human" ? (
            <button className="rb-end-turn" onClick={handleStart} disabled={!deckAId || !deckBId || deckAId === deckBId}>
              Spiel starten
            </button>
          ) : (
            <button className="rb-end-turn" onClick={handleStartVsBot} disabled={!deckAId || !deckBId}>
              Gegen Bot starten
            </button>
          )}
          {mode === "human" && deckAId && deckAId === deckBId && (
            <p className="rb-db-hint">Bitte zwei unterschiedliche Decks wählen.</p>
          )}
        </div>
      )}
    </div>
  );
}
