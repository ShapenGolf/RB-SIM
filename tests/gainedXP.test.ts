import { describe, it, expect } from "vitest";
import { computeMight } from "../src/game/might";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { gainXP } from "../src/game/templatedEffectEngine";
import { runTurnStart } from "../src/game/turnFlow";
import { makeGame, putOnBase } from "./helpers";

/**
 * PlayerState.gainedXPThisTurn (game/state.ts), set via templatedEffectEngine.ts's gainXP —
 * the chokepoint for every XP-gain site in the engine. Exercised via Wily Newtfish, the one card
 * that reads it.
 */
describe("gainedXPThisTurn", () => {
  it("Wily Newtfish (unl-108): no bonus before any XP is gained this turn", () => {
    const game = makeGame();
    const newtfish = putOnBase(game, "unl-108", "0");

    const card = getCard("unl-108");
    expect(computeMight(game, getCard, newtfish, "none")).toBe(card.might ?? 0);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, newtfish)).toBe(false);
  });

  it("Wily Newtfish (unl-108): +1 Might and Ganking once the controller has gained XP this turn", () => {
    const game = makeGame();
    const newtfish = putOnBase(game, "unl-108", "0");
    const card = getCard("unl-108");
    const baseMight = card.might ?? 0;

    gainXP(game.players["0"], 1);

    expect(computeMight(game, getCard, newtfish, "none")).toBe(baseMight + 1);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, newtfish)).toBe(true);
  });

  it("does not react to the OPPONENT gaining XP", () => {
    const game = makeGame();
    const newtfish = putOnBase(game, "unl-108", "0");
    const card = getCard("unl-108");
    const baseMight = card.might ?? 0;

    gainXP(game.players["1"], 1);

    expect(computeMight(game, getCard, newtfish, "none")).toBe(baseMight);
  });

  it("a zero-amount gainXP call does not set the flag", () => {
    const game = makeGame();
    gainXP(game.players["0"], 0);
    expect(game.players["0"].gainedXPThisTurn).toBe(false);
  });

  it("resets to false at Awaken (turn start)", () => {
    const game = makeGame();
    gainXP(game.players["0"], 1);
    expect(game.players["0"].gainedXPThisTurn).toBe(true);

    runTurnStart(game, "0");

    expect(game.players["0"].gainedXPThisTurn).toBe(false);
  });
});
