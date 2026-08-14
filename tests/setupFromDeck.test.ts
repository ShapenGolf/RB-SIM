import { describe, it, expect } from "vitest";
import type { Card } from "../src/cards/types";
import { getCard, listOfficialCards } from "../src/cards/db";
import { setupGame } from "../src/game/setup";
import { validateDeck, type DeckList } from "../src/cards/deckValidation";

const LEGEND_ID = "unl-230"; // Bashful Bloom (Calm/Mind)
const CHAMPION_ID = "unl-82"; // Lillia, Fae Fawn — matches the Legend's "Lillia" tag

/** Assembles a real, legal DeckList straight from the official catalog (not a hand-built fixture), to exercise setupGame's deck-driven path end to end. */
function buildSampleLegalDeck(): DeckList {
  const legend = getCard(LEGEND_ID);
  const champion = getCard(CHAMPION_ID);
  const fitsDomainIdentity = (c: Card) => c.domains.every((d) => d === "Colorless" || legend.domains.includes(d));
  const pool = listOfficialCards().filter(
    (c) =>
      (c.type === "unit" || c.type === "champion" || c.type === "gear" || c.type === "spell") &&
      fitsDomainIdentity(c) &&
      !c.isSignature &&
      c.name !== champion.name,
  );
  const byName = new Map<string, Card>();
  for (const c of pool) if (!byName.has(c.name)) byName.set(c.name, c);

  const mainDeck: string[] = [CHAMPION_ID, CHAMPION_ID, CHAMPION_ID];
  for (const c of byName.values()) {
    if (mainDeck.length >= 60) break;
    const limit = c.keywords.some((k) => k.keyword === "unique") ? 1 : 3;
    for (let i = 0; i < limit; i += 1) mainDeck.push(c.id);
  }

  return {
    legendId: LEGEND_ID,
    chosenChampionId: CHAMPION_ID,
    mainDeck,
    runeDeck: [...Array(6).fill("ogn-42"), ...Array(6).fill("ogn-89")], // 6 Calm + 6 Mind Rune
    battlefields: ["unl-205", "unl-206", "ogn-275"],
  };
}

describe("setupGame with a real DeckList", () => {
  const deck = buildSampleLegalDeck();

  it("assembles a legal sample deck (sanity check on the fixture itself)", () => {
    expect(validateDeck(deck)).toEqual([]);
  });

  it("deals the player's real deck contents instead of the domain-cycling fallback", () => {
    const game = setupGame({
      player0Domains: [],
      player1Domains: [],
      battlefieldCardIds: [deck.battlefields[0], deck.battlefields[1]],
      player0Deck: deck,
      player1Deck: deck,
    });

    for (const playerId of ["0", "1"] as const) {
      const player = game.players[playerId];
      expect(player.hand).toHaveLength(7);
      expect(player.hand.length + player.mainDeck.length).toBe(deck.mainDeck.length);
      // Every card in hand/deck came from the real deck list, not the domain-cycling fallback pool.
      for (const cardId of [...player.hand, ...player.mainDeck]) {
        expect(deck.mainDeck).toContain(cardId);
      }
      expect(player.runeDeck).toHaveLength(deck.runeDeck.length);
      for (const rune of player.runeDeck) {
        expect(["Calm", "Mind"]).toContain(rune.domain);
      }
      expect(player.runePool).toEqual([]);
    }

    expect(game.battlefields.map((b) => b.cardId)).toEqual([deck.battlefields[0], deck.battlefields[1]]);
  });

  it("still supports the domain-cycling fallback when no deck is given (backward compatibility)", () => {
    const game = setupGame();
    expect(game.players["0"].hand).toHaveLength(7);
    expect(game.players["1"].hand).toHaveLength(7);
  });
});
