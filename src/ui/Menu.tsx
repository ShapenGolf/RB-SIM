import { useMemo, useState } from "react";
import { validateDeck } from "../cards/deckValidation";
import { listSavedDecks, type SavedDeck } from "../decks/store";
import type { SetupOptions } from "../game/setup";

/**
 * Home screen. Deck building + picking who starts is fully wired to a real local (same-screen)
 * game. Networked host/join with a shareable room code needs a persistent server (swapping the
 * boardgame.io `Local()` transport for `SocketIO()`, see ui/client.ts) — not built yet, so this
 * is intentionally labeled "local" rather than pretending to offer online play.
 *
 * Battlefield selection happens in-game, right after "Spiel starten" (see game/game.ts's
 * "battlefieldSelect" phase and ui/Board.tsx) — not here. `battlefieldCardIds` below is just a
 * placeholder default: the phase overwrites both slots as soon as each player picks from their
 * own submitted pool, so it doesn't matter which of a deck's 3 Battlefields it is.
 */
export function Menu({ onOpenDeckBuilder, onStartGame }: { onOpenDeckBuilder: () => void; onStartGame: (options: SetupOptions) => void }) {
  const savedDecks = useMemo(() => listSavedDecks(), []);
  const legalDecks = useMemo(() => savedDecks.filter((d) => validateDeck(d.deck).length === 0), [savedDecks]);

  const [deckAId, setDeckAId] = useState("");
  const [deckBId, setDeckBId] = useState("");
  const [starter, setStarter] = useState<"A" | "B">("A");

  function findDeck(id: string): SavedDeck | undefined {
    return legalDecks.find((d) => d.id === id);
  }

  function handleStart() {
    const deckA = findDeck(deckAId);
    const deckB = findDeck(deckBId);
    if (!deckA || !deckB) return;
    // Slot "0" always goes first mechanically (see game/turnFlow.ts's second-player Channel
    // bonus, hardcoded to player "1") — "who starts" just decides which chosen deck fills slot 0.
    const firstDeck = starter === "A" ? deckA : deckB;
    const secondDeck = starter === "A" ? deckB : deckA;
    const battlefieldCardIds: [string, string] = [firstDeck.deck.battlefields[0], secondDeck.deck.battlefields[0]];
    onStartGame({
      player0Domains: [],
      player1Domains: [],
      battlefieldCardIds,
      player0Deck: firstDeck.deck,
      player1Deck: secondDeck.deck,
    });
  }

  return (
    <div className="rb-menu">
      <h1>Riftbound Simulator</h1>
      <button className="rb-end-turn" onClick={onOpenDeckBuilder}>
        Deckbuilder öffnen
      </button>

      <div className="rb-section-label" style={{ marginTop: 24 }}>
        Lokales Spiel starten
      </div>
      <p className="rb-db-hint">
        Zwei legale, gespeicherte Decks nötig. Nach dem Start wählt jeder Spieler noch, welches seiner 3 Battlefields
        mit an den Tisch kommt. Online-Beitritt per Code folgt, sobald der Server dafür steht — aktuell spielen beide
        auf demselben Bildschirm.
      </p>

      {legalDecks.length < 2 ? (
        <p className="rb-db-hint">Baue mindestens 2 legale Decks im Deckbuilder, um ein Spiel zu starten.</p>
      ) : (
        <div className="rb-menu-start">
          <label className="rb-menu-field">
            Deck Spieler A
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
            Deck Spieler B
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
              <option value="A">Spieler A</option>
              <option value="B">Spieler B</option>
            </select>
          </label>
          <button className="rb-end-turn" onClick={handleStart} disabled={!deckAId || !deckBId || deckAId === deckBId}>
            Spiel starten
          </button>
          {deckAId && deckAId === deckBId && <p className="rb-db-hint">Bitte zwei unterschiedliche Decks wählen.</p>}
        </div>
      )}
    </div>
  );
}
