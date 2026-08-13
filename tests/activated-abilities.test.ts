import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { activateAbility } from "../src/game/moves";
import { computeMight } from "../src/game/might";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof activateAbility>[0];
}

describe("activateAbility — auto-matched real cards", () => {
  it("Heart of Dark Ice (0 Energy, Exhaust: +3 Might this turn to a chosen unit)", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-52", "0", { exhausted: false });
    const target = putOnBase(game, "unit-plain-footman", "0");
    const before = computeMight(game, getCard, target, "attacking");

    const result = activateAbility(ctx(game, "0"), {
      instanceId: gear.instanceId,
      energyRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(computeMight(game, getCard, target, "attacking")).toBe(before + 3);
    expect(gear.exhausted).toBe(true);
  });

  it("rejects activating an already-exhausted ability card", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-52", "0", { exhausted: true });
    const target = putOnBase(game, "unit-plain-footman", "0");

    const result = activateAbility(ctx(game, "0"), {
      instanceId: gear.instanceId,
      energyRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBe("INVALID_MOVE");
  });

  it("Orb of Regret (0 Energy, Exhaust: -1 Might this turn to a chosen unit)", () => {
    const game = makeGame();
    const orb = putOnBase(game, "ogn-90", "0", { exhausted: false });
    const target = putOnBase(game, "unit-plain-footman", "1");
    const before = computeMight(game, getCard, target, "attacking");

    activateAbility(ctx(game, "0"), {
      instanceId: orb.instanceId,
      energyRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(computeMight(game, getCard, target, "attacking")).toBe(before - 1);
  });

  it("rejects paying the wrong number of Energy Runes", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-52", "0", { exhausted: false });
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    const result = activateAbility(ctx(game, "0"), {
      instanceId: gear.instanceId,
      energyRuneIds: ["r1"], // this ability costs 0 Energy
    });

    expect(result).toBe("INVALID_MOVE");
  });
});
