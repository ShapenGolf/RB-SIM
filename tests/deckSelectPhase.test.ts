import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import type { FnContext } from "boardgame.io";
import type { Card } from "../src/cards/types";
import { getCard, listOfficialCards } from "../src/cards/db";
import { submitDeck } from "../src/game/moves";
import { RiftboundGame } from "../src/game/game";
import { validateDeck, type DeckList } from "../src/cards/deckValidation";
import { setupGame } from "../src/game/setup";
import { makeGame } from "./helpers";
import type { GameState } from "../src/game/state";

const LEGEND_ID = "unl-230"; // Bashful Bloom (Calm/Mind)
const CHAMPION_ID = "unl-82"; // Lillia, Fae Fawn — matches the Legend's "Lillia" tag

/** Real, legal DeckList straight from the official catalog — same fixture-building approach as tests/setupFromDeck.test.ts. */
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
    if (mainDeck.length >= 40) break;
    const limit = c.keywords.some((k) => k.keyword === "unique") ? 1 : 3;
    for (let i = 0; i < limit && mainDeck.length < 40; i += 1) mainDeck.push(c.id);
  }

  return {
    legendId: LEGEND_ID,
    chosenChampionId: CHAMPION_ID,
    mainDeck,
    runeDeck: [...Array(6).fill("ogn-42"), ...Array(6).fill("ogn-89")],
    battlefields: ["unl-205", "unl-206", "ogn-275"],
  };
}

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("submitDeck", () => {
  const deck = buildSampleLegalDeck();

  it("is a legal sample deck (sanity check on the fixture)", () => {
    expect(validateDeck(deck)).toEqual([]);
  });

  it("rebuilds the player from the submitted deck", () => {
    const game = makeGame(); // MVP-fallback players — empty battlefieldPool
    expect(game.players["0"].battlefieldPool).toEqual([]);

    const result = submitDeck(ctx(game, "0"), { deck });

    expect(result).toBeUndefined();
    expect(game.players["0"].battlefieldPool).toEqual(deck.battlefields);
    expect(game.players["0"].legend).toEqual({ cardId: LEGEND_ID, exhausted: false });
    // The Chosen Champion starts set aside in its own zone (see setup.ts's buildPlayerFromDeckList),
    // not shuffled into the Main Deck's draw pile — so hand + mainDeck is one short of the full list.
    expect(game.players["0"].championZone).toBe(deck.chosenChampionId);
    expect(game.players["0"].mainDeck.length + game.players["0"].hand.length).toBe(deck.mainDeck.length - 1);
  });

  it("rejects a second submission for the same player", () => {
    const game = makeGame();
    submitDeck(ctx(game, "0"), { deck });

    const result = submitDeck(ctx(game, "0"), { deck });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects an illegal deck", () => {
    const game = makeGame();
    const illegal: DeckList = { ...deck, mainDeck: deck.mainDeck.slice(0, 10) }; // too few cards

    const result = submitDeck(ctx(game, "0"), { deck: illegal });

    expect(result).toBe(INVALID_MOVE);
    expect(game.players["0"].battlefieldPool).toEqual([]);
  });
});

describe("RiftboundGame's deckSelect phase", () => {
  const deck = buildSampleLegalDeck();

  it("endIf is already true for a local match (both decks known from setup)", () => {
    const game = setupGame({
      player0Domains: [],
      player1Domains: [],
      battlefieldCardIds: ["battlefield-ancient-ruins", "battlefield-ancient-ruins"],
      player0Deck: deck,
      player1Deck: deck,
    });

    const endIf = RiftboundGame.phases!.deckSelect!.endIf as (arg: { G: GameState }) => boolean;
    expect(endIf({ G: game })).toBe(true);
  });

  it("endIf is false for a fresh online match (no decks submitted yet) and true once both submit", () => {
    const game = setupGame(); // no player{0,1}Deck — the online "no setupData yet" shape
    const endIf = RiftboundGame.phases!.deckSelect!.endIf as (arg: { G: GameState }) => boolean;
    expect(endIf({ G: game })).toBe(false);

    submitDeck(ctx(game, "0"), { deck });
    expect(endIf({ G: game })).toBe(false);

    submitDeck(ctx(game, "1"), { deck });
    expect(endIf({ G: game })).toBe(true);
  });
});
