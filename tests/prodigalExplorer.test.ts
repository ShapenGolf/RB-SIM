import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { activateLegendAbility } from "../src/game/moves";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { getCard } from "../src/cards/db";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof activateLegendAbility>[0];
}

/**
 * Prodigal Explorer (sfd-199, a Legend): "Exhaust: [Reaction] — Draw 1. Use only if you've
 * chosen enemy units and/or gear twice this turn with spells or unit abilities." Uses
 * PlayerState.chosenEnemyTargetsThisTurn, incremented inside SpecialCaseEngine.onChosen
 * (registry.ts) — the same "chosen as a target" chokepoint jae-medarda.ts already relies on.
 */
describe("Prodigal Explorer (sfd-199)", () => {
  it("rejects activating before the 2-target threshold is reached", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-199", exhausted: false };
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    SpecialCaseEngine.onChosen(game, getCard, "0", enemy.instanceId, getCard("sfd-34")); // a spell

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
  });

  it("draws once the 2-target threshold is reached via a spell and a unit ability", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-199", exhausted: false };
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const enemy1 = putOnBase(game, "unit-plain-footman", "1");
    const enemy2 = putOnBase(game, "unit-plain-footman", "1");
    SpecialCaseEngine.onChosen(game, getCard, "0", enemy1.instanceId, getCard("sfd-34")); // spell
    SpecialCaseEngine.onChosen(game, getCard, "0", enemy2.instanceId, getCard("unit-plain-footman")); // unit ability

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.players["0"].legend?.exhausted).toBe(true);
    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
  });

  it("does not count a FRIENDLY target, or a champion/Legend-ability-driven choice", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-199", exhausted: false };
    const friendly = putOnBase(game, "unit-plain-footman", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    SpecialCaseEngine.onChosen(game, getCard, "0", friendly.instanceId, getCard("sfd-34")); // friendly, doesn't count
    SpecialCaseEngine.onChosen(game, getCard, "0", enemy.instanceId, getCard("sfd-199")); // Legend ability, doesn't count

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
  });
});
