import { describe, it, expect } from "vitest";
import { activateLegendAbility } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof activateLegendAbility>[0];
}

describe("Bounty Hunter (ogn-309)", () => {
  it("grants a unit Ganking this turn for free, on exhaust", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-309", exhausted: false };
    const target = putOnBase(game, "unit-plain-footman", "0");

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: [], targetInstanceId: target.instanceId });

    expect(result).toBeUndefined();
    expect(game.players["0"].legend?.exhausted).toBe(true);
    expect(target.grantedThisTurn).toContainEqual({ keyword: "ganking" });
  });
});

describe("Eye of Twilight (ven-147)", () => {
  it("grants a friendly unit Tank this turn, but not an enemy's", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ven-147", exhausted: false };
    const enemy = putOnBase(game, "unit-plain-footman", "1");

    activateLegendAbility(ctx(game, "0"), { energyRuneIds: [], targetInstanceId: enemy.instanceId });
    expect(enemy.grantedThisTurn).toEqual([]);

    game.players["0"].legend = { cardId: "ven-147", exhausted: false };
    const ally = putOnBase(game, "unit-plain-guard", "0");
    activateLegendAbility(ctx(game, "0"), { energyRuneIds: [], targetInstanceId: ally.instanceId });
    expect(ally.grantedThisTurn).toContainEqual({ keyword: "tank" });
  });
});

describe("Defender of Tomorrow (ven-149)", () => {
  it("readies a gear the controller controls, for 1 Energy", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ven-149", exhausted: false };
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    const gear = putOnBase(game, "gear-tactical-banner", "0", { exhausted: true });

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: ["r1"], targetInstanceId: gear.instanceId });

    expect(result).toBeUndefined();
    expect(gear.exhausted).toBe(false);
    expect(game.players["0"].runePool[0].exhausted).toBe(true);
  });

  it("doesn't ready a non-gear target", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ven-149", exhausted: false };
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    const unit = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });

    activateLegendAbility(ctx(game, "0"), { energyRuneIds: ["r1"], targetInstanceId: unit.instanceId });

    expect(unit.exhausted).toBe(true);
  });
});
