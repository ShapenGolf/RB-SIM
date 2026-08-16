import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { playCard } from "../src/game/moves";
import { makeGame } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof playCard>[0];
}

/**
 * The Chosen Champion starts the game set aside in its own zone, "ready to play" from turn 1
 * (see docs/deck-building-rules.md) — game/setup.ts's buildPlayerFromDeckList pulls it out of the
 * Main Deck before shuffling, and moves.ts's playCard grew a `fromChampionZone` option to play it
 * from there instead of a hand index. These tests exercise that move directly (setupFromDeck.test.ts
 * covers the setup side: that the zone gets populated correctly).
 */
describe("playCard: fromChampionZone", () => {
  it("plays the Chosen Champion from its zone onto Base and clears the zone", () => {
    const game = makeGame();
    game.players["0"].championZone = "ogn-66"; // Ahri, Alluring — no keywords, no battlefield-entry text
    game.players["0"].runePool = [{ instanceId: "power", domain: "Calm" as const, exhausted: false }].concat(
      Array.from({ length: 5 }, (_, i) => ({ instanceId: `r${i}`, domain: "Calm" as const, exhausted: false })),
    );

    const result = playCard(ctx(game, "0"), {
      fromChampionZone: true,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].championZone).toBeNull();
    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "ogn-66");
    expect(newInstanceId).toBeDefined();
  });

  it("rejects playing from an empty Champion Zone", () => {
    const game = makeGame();
    game.players["0"].championZone = null;

    const result = playCard(ctx(game, "0"), {
      fromChampionZone: true,
      energyRuneIds: [],
      powerRuneIds: [],
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("still requires a real grant to play the zone champion directly to a Battlefield", () => {
    const game = makeGame();
    game.players["0"].championZone = "ogn-66";
    game.players["0"].runePool = [{ instanceId: "power", domain: "Calm" as const, exhausted: false }].concat(
      Array.from({ length: 5 }, (_, i) => ({ instanceId: `r${i}`, domain: "Calm" as const, exhausted: false })),
    );

    const result = playCard(ctx(game, "0"), {
      fromChampionZone: true,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
      ambushBattlefieldIndex: 0,
    });

    expect(result).toBe(INVALID_MOVE);
    expect(game.players["0"].championZone).toBe("ogn-66"); // untouched — the move was rejected
  });
});
