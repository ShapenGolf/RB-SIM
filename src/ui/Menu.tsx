import { useMemo, useState } from "react";
import { validateDeck } from "../cards/deckValidation";
import { listSavedDecks, type SavedDeck } from "../decks/store";
import type { SetupOptions } from "../game/setup";
import { getCard } from "../cards/db";
import { CardFace } from "./CardFace";

/**
 * Home screen. Deck building + picking who starts is fully wired to a real local (same-screen)
 * game. Networked host/join with a shareable room code needs a persistent server (swapping the
 * boardgame.io `Local()` transport for `SocketIO()`, see ui/client.ts) — not built yet, so this
 * is intentionally labeled "local" rather than pretending to offer online play.
 */
export function Menu({ onOpenDeckBuilder, onStartGame }: { onOpenDeckBuilder: () => void; onStartGame: (options: SetupOptions) => void }) {
  const savedDecks = useMemo(() => listSavedDecks(), []);
  const legalDecks = useMemo(() => savedDecks.filter((d) => validateDeck(d.deck).length === 0), [savedDecks]);

  const [deckAId, setDeckAId] = useState("");
  const [deckBId, setDeckBId] = useState("");
  const [starter, setStarter] = useState<"A" | "B">("A");
  // Each player brings 1 of their own 3 submitted Battlefields to the shared table (see
  // docs/rules-reference.md: "2 aktive Battlefields, je 1 von 3 eingereichten pro Spieler") —
  // null means "not chosen yet", defaulted to the first option once a deck is picked.
  const [battlefieldAId, setBattlefieldAId] = useState<string | null>(null);
  const [battlefieldBId, setBattlefieldBId] = useState<string | null>(null);

  function findDeck(id: string): SavedDeck | undefined {
    return legalDecks.find((d) => d.id === id);
  }

  const deckA = findDeck(deckAId);
  const deckB = findDeck(deckBId);
  const chosenBattlefieldA = battlefieldAId && deckA?.deck.battlefields.includes(battlefieldAId) ? battlefieldAId : (deckA?.deck.battlefields[0] ?? null);
  const chosenBattlefieldB = battlefieldBId && deckB?.deck.battlefields.includes(battlefieldBId) ? battlefieldBId : (deckB?.deck.battlefields[0] ?? null);

  function handleStart() {
    if (!deckA || !deckB || !chosenBattlefieldA || !chosenBattlefieldB) return;
    // Slot "0" always goes first mechanically (see game/turnFlow.ts's second-player Channel
    // bonus, hardcoded to player "1") — "who starts" just decides which chosen deck fills slot 0.
    const firstDeck = starter === "A" ? deckA : deckB;
    const secondDeck = starter === "A" ? deckB : deckA;
    const battlefieldCardIds: [string, string] = [chosenBattlefieldA, chosenBattlefieldB];
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
        Zwei legale, gespeicherte Decks nötig. Online-Beitritt per Code folgt, sobald der Server dafür steht — aktuell spielen
        beide auf demselben Bildschirm.
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

          {deckA && deckB && deckAId !== deckBId && (
            <>
              <div className="rb-section-label" style={{ marginTop: 10 }}>
                Battlefields wählen
              </div>
              <p className="rb-db-hint">
                Jeder bringt 1 von seinen 3 eingereichten Battlefields mit an den Tisch — zusammen ergeben die
                gewählten Karten die 2 Battlefields dieser Partie.
              </p>
              <div className="rb-menu-battlefield-pickers">
                <div>
                  <div className="rb-section-label">Spieler A</div>
                  <div className="rb-db-card-grid">
                    {deckA.deck.battlefields.map((id) => (
                      <CardFace
                        key={id}
                        card={getCard(id)}
                        size="sm"
                        selected={id === chosenBattlefieldA}
                        onClick={() => setBattlefieldAId(id)}
                        footer={<div className="rb-db-legend-name">{getCard(id).name}</div>}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="rb-section-label">Spieler B</div>
                  <div className="rb-db-card-grid">
                    {deckB.deck.battlefields.map((id) => (
                      <CardFace
                        key={id}
                        card={getCard(id)}
                        size="sm"
                        selected={id === chosenBattlefieldB}
                        onClick={() => setBattlefieldBId(id)}
                        footer={<div className="rb-db-legend-name">{getCard(id).name}</div>}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            className="rb-end-turn"
            onClick={handleStart}
            disabled={!deckAId || !deckBId || deckAId === deckBId || !chosenBattlefieldA || !chosenBattlefieldB}
          >
            Spiel starten
          </button>
          {deckAId && deckAId === deckBId && <p className="rb-db-hint">Bitte zwei unterschiedliche Decks wählen.</p>}
        </div>
      )}
    </div>
  );
}
