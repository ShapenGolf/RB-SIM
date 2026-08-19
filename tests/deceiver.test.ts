import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { resolveHoldTriggers } from "../src/game/combat";
import { resolveOptionalCost } from "../src/game/moves";
import { getCard } from "../src/cards/db";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof resolveOptionalCost>[0];
}

describe("Deceiver (unl-199)", () => {
  it("onHold offers to discard 1 + exhaust the Legend to play a ready copy of a friendly unit there", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-199", exhausted: false };
    game.battlefields[0].controller = "0";
    const unit = putOnBase(game, "unit-plain-footman", "0");
    game.battlefields[0].units["0"].push(unit.instanceId);
    game.players["0"].hand = ["unit-plain-footman"];

    resolveHoldTriggers(game, getCard, "0");

    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "deceiver",
      cost: { energy: 0, exhaustLegend: true, discardCount: 1 },
      payload: "0",
    });

    const result = resolveOptionalCost(ctx(game, "0"), { pay: true, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.players["0"].legend?.exhausted).toBe(true);
    expect(game.players["0"].hand).toHaveLength(0);

    const copyId = game.battlefields[0].units["0"].find((id) => id !== unit.instanceId);
    expect(copyId).toBeDefined();
    const copy = game.instances[copyId!];
    expect(copy.cardId).toBe("unit-plain-footman");
    expect(copy.exhausted).toBe(false);
    expect(copy.statuses.temporary).toBe(true);
  });

  it("does not offer without a friendly unit at the held battlefield to copy conceptually — still offers, but paying with nothing to copy is a no-op", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-199", exhausted: false };
    game.battlefields[0].controller = "0";
    game.players["0"].hand = ["unit-plain-footman"];

    resolveHoldTriggers(game, getCard, "0");
    expect(game.pendingOptionalCost).not.toBeNull();

    const before = Object.keys(game.instances).length;
    resolveOptionalCost(ctx(game, "0"), { pay: true, energyRuneIds: [] });

    expect(Object.keys(game.instances)).toHaveLength(before); // nothing to copy, no token created
  });

  it("does not re-offer while a Legend ability's optional cost is already pending", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-199", exhausted: false };
    game.battlefields[0].controller = "0";
    game.battlefields[1].controller = "0";
    putOnBase(game, "unit-plain-footman", "0");
    game.pendingOptionalCost = { playerId: "0", specialCaseId: "something-else", cost: { energy: 1 } };

    resolveHoldTriggers(game, getCard, "0");

    expect(game.pendingOptionalCost.specialCaseId).toBe("something-else"); // not overwritten
  });

  it("rejects paying without enough cards to discard", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-199", exhausted: false };
    game.battlefields[0].controller = "0";
    const unit = putOnBase(game, "unit-plain-footman", "0");
    game.battlefields[0].units["0"].push(unit.instanceId);
    game.players["0"].hand = []; // nothing to discard

    resolveHoldTriggers(game, getCard, "0");
    const result = resolveOptionalCost(ctx(game, "0"), { pay: true, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
  });
});
