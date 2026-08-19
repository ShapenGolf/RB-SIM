import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { checkBecameMighty } from "../src/game/mightTransition";
import { resolveOptionalCost } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof resolveOptionalCost>[0];
}

const MIGHTY_BONUS = 5; // pushes the 2-Might test fixture unit to 7, well past the 5+ threshold

/**
 * "becomes Mighty" (5+ Might) checkpoint-scan detection — see game/mightTransition.ts
 * checkBecameMighty. Might itself is bumped directly via tempMightBonus here (the same field a
 * real card effect would mutate) rather than via a specific Might-granting card, since
 * checkBecameMighty/the two cards' hooks are what's under test, not the surrounding action.
 */
describe("became Mighty checkpoint", () => {
  it("Fiora, Worthy: offers to ready the newly-Mighty unit, paid with an Order rune", () => {
    const game = makeGame();
    putOnBase(game, "sfd-180", "0");
    const unit = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });
    unit.tempMightBonus = MIGHTY_BONUS;

    checkBecameMighty(game, getCard);
    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "fiora-worthy",
      cost: { energy: 0, runeDomain: "Order" },
      payload: unit.instanceId,
    });

    game.players["0"].runePool.push({ instanceId: "r0", domain: "Order", exhausted: false });
    const result = resolveOptionalCost(ctx(game, "0"), { pay: true, energyRuneIds: [], powerRuneId: "r0" });

    expect(result).toBeUndefined();
    expect(unit.exhausted).toBe(false);
    expect(game.pendingOptionalCost).toBeNull();
  });

  it("Fiora, Worthy: declining leaves the unit exhausted", () => {
    const game = makeGame();
    putOnBase(game, "sfd-180", "0");
    const unit = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });
    unit.tempMightBonus = MIGHTY_BONUS;

    checkBecameMighty(game, getCard);
    resolveOptionalCost(ctx(game, "0"), { pay: false, energyRuneIds: [] });

    expect(unit.exhausted).toBe(true);
  });

  it("Fiora, Worthy: no double-fire while the unit stays Mighty", () => {
    const game = makeGame();
    putOnBase(game, "sfd-180", "0");
    const unit = putOnBase(game, "unit-plain-footman", "0", { exhausted: false });
    unit.tempMightBonus = MIGHTY_BONUS;

    checkBecameMighty(game, getCard);
    expect(game.pendingOptionalCost).not.toBeNull();
    game.pendingOptionalCost = null;

    checkBecameMighty(game, getCard); // still Mighty, nothing changed — must not re-offer
    expect(game.pendingOptionalCost).toBeNull();
  });

  it("Grand Duelist: offers to exhaust itself to channel 1 rune exhausted", () => {
    const game = makeGame();
    const duelist = putOnBase(game, "sfd-205", "0", { exhausted: false });
    const ally = putOnBase(game, "unit-plain-footman", "0");
    ally.tempMightBonus = MIGHTY_BONUS;
    game.players["0"].runeDeck = [{ instanceId: "rd0", domain: "Fury", exhausted: false }];

    checkBecameMighty(game, getCard);
    expect(game.pendingOptionalCost?.cost).toEqual({ energy: 0, exhaustSourceInstanceId: duelist.instanceId });

    const result = resolveOptionalCost(ctx(game, "0"), { pay: true, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(duelist.exhausted).toBe(true);
    expect(game.players["0"].runePool).toContainEqual({ instanceId: "rd0", domain: "Fury", exhausted: true });
  });

  it("Grand Duelist: does not offer if it's already exhausted", () => {
    const game = makeGame();
    putOnBase(game, "sfd-205", "0", { exhausted: true });
    const ally = putOnBase(game, "unit-plain-footman", "0");
    ally.tempMightBonus = MIGHTY_BONUS;

    checkBecameMighty(game, getCard);

    expect(game.pendingOptionalCost).toBeNull();
  });

  it("exhaustSourceInstanceId cost: rejects paying if the source is already exhausted", () => {
    const game = makeGame();
    const duelist = putOnBase(game, "sfd-205", "0", { exhausted: true }); // already exhausted by the time payment is attempted
    game.pendingOptionalCost = {
      playerId: "0",
      specialCaseId: "grand-duelist",
      cost: { energy: 0, exhaustSourceInstanceId: duelist.instanceId },
    };

    const result = resolveOptionalCost(ctx(game, "0"), { pay: true, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
  });

  it("re-fires after dropping below 5 Might and rising again", () => {
    const game = makeGame();
    putOnBase(game, "sfd-180", "0");
    const unit = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });
    unit.tempMightBonus = MIGHTY_BONUS;

    checkBecameMighty(game, getCard);
    game.pendingOptionalCost = null;
    unit.tempMightBonus = 0; // drops back to 2 Might (below the threshold)
    checkBecameMighty(game, getCard);
    expect(game.pendingOptionalCost).toBeNull(); // no false "became Mighty" on the way down

    unit.tempMightBonus = MIGHTY_BONUS; // crosses the threshold again
    checkBecameMighty(game, getCard);
    expect(game.pendingOptionalCost).not.toBeNull();
  });
});
