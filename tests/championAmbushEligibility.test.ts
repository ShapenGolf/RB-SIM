import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof playCard>[0];
}

/**
 * Regression test for a real playtest bug: `playCard`'s `ambushBattlefieldIndex` option used to
 * let ANY champion skip Base and land directly on a Battlefield, with zero eligibility checks
 * (see git history on moves.ts's playCard) — contradicting both the printed rules (only cards
 * with an actual grant, like Ambush or Blitzcrank's own text, may do this) and the project's
 * documented simplification that Champions behave like normal Units (see README.md). Champions
 * with a real printed grant (e.g. Blitzcrank, ogn-67) are covered by tests/bespoke-origins.test.ts.
 */
describe("playCard: champions need an actual grant to play directly to a Battlefield", () => {
  it("rejects a plain champion from playing to an open Battlefield", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-66"]; // Ahri, Alluring — no keywords, no battlefield-entry text
    game.players["0"].runePool = [{ instanceId: "power", domain: "Calm" as const, exhausted: false }].concat(
      Array.from({ length: 5 }, (_, i) => ({ instanceId: `r${i}`, domain: "Calm" as const, exhausted: false })),
    );

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
      ambushBattlefieldIndex: 0,
    });

    expect(result).toBe(INVALID_MOVE);
    expect(game.battlefields[0].units["0"]).toHaveLength(0);
  });

  it("rejects a plain champion from playing to an enemy-occupied Battlefield", () => {
    const game = makeGame();
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    enemy.zone = "battlefield";
    enemy.battlefieldIndex = 0;
    game.battlefields[0].units["1"].push(enemy.instanceId);

    game.players["0"].hand = ["ogn-66"];
    game.players["0"].runePool = [{ instanceId: "power", domain: "Calm" as const, exhausted: false }].concat(
      Array.from({ length: 5 }, (_, i) => ({ instanceId: `r${i}`, domain: "Calm" as const, exhausted: false })),
    );

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
      ambushBattlefieldIndex: 0,
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("still allows a plain champion to be played normally to Base", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-66"];
    game.players["0"].runePool = [{ instanceId: "power", domain: "Calm" as const, exhausted: false }].concat(
      Array.from({ length: 5 }, (_, i) => ({ instanceId: `r${i}`, domain: "Calm" as const, exhausted: false })),
    );

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
    });

    expect(result).toBeUndefined();
    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "ogn-66");
    expect(newInstanceId).toBeDefined();
  });
});
