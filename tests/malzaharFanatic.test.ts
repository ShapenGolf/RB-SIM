import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { activateAbility } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof activateAbility>[0];
}

/**
 * Malzahar, Fanatic (ogn-113): "Kill a friendly unit or gear, Exhaust: [Action] — [Add] Rune
 * Rune." Uses the new ActivatedAbilityCost.killFriendlyUnitOrGear (game/moves.ts
 * activateAbility) plus addRuneToPool ([Add] itself was never the blocker for a FIXED amount).
 */
describe("Malzahar, Fanatic (ogn-113)", () => {
  it("kills the weakest OTHER friendly unit and adds 2 Mind Runes", () => {
    const game = makeGame();
    const malzahar = putOnBase(game, "ogn-113", "0", { exhausted: false });
    const weak = putOnBase(game, "unit-doomed-recruit", "0"); // 1 Might
    const strong = putOnBase(game, "unit-blazing-scorcher", "0"); // 3 Might

    const result = activateAbility(ctx(game, "0"), { instanceId: malzahar.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.instances[weak.instanceId]).toBeUndefined();
    expect(game.instances[strong.instanceId]).toBeDefined();
    expect(malzahar.exhausted).toBe(true);
    const addedDomains = game.players["0"].runePool.map((r) => r.domain).sort();
    expect(addedDomains).toEqual(["Mind", "Mind"]);
  });

  it("falls back to killing a friendly gear if no other friendly unit exists", () => {
    const game = makeGame();
    const malzahar = putOnBase(game, "ogn-113", "0", { exhausted: false });
    const gear = putOnBase(game, "sfd-169", "0");

    const result = activateAbility(ctx(game, "0"), { instanceId: malzahar.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(game.players["0"].runePool).toHaveLength(2);
  });

  it("rejects when neither a friendly unit nor gear is available to kill", () => {
    const game = makeGame();
    const malzahar = putOnBase(game, "ogn-113", "0", { exhausted: false });

    const result = activateAbility(ctx(game, "0"), { instanceId: malzahar.instanceId, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
    expect(malzahar.exhausted).toBe(false);
  });
});
