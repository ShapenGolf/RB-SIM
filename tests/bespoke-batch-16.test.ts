import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { computeMight } from "../src/game/might";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { battlefieldPseudoInstance } from "../src/game/pseudoInstance";
import { makeGame, putOnBase } from "./helpers";

describe("Protective Sands (ven-162)", () => {
  it("offers 1 Energy to draw 1 on conquer with 4 or fewer runes", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard("ven-162");
    const pseudo = battlefieldPseudoInstance("ven-162", "0", 0);

    SpecialCaseEngine.onConquerHere(game, card, pseudo, [], 0);

    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "protective-sands",
      cost: { energy: 1 },
      payload: undefined,
    });

    SpecialCaseEngine.onOptionalCostPaid(game, "protective-sands", "0");
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
  });

  it("doesn't offer with more than 4 runes", () => {
    const game = makeGame();
    for (let i = 0; i < 5; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Calm", exhausted: false });
    }
    const card = getCard("ven-162");
    const pseudo = battlefieldPseudoInstance("ven-162", "0", 0);

    SpecialCaseEngine.onConquerHere(game, card, pseudo, [], 0);

    expect(game.pendingOptionalCost).toBeNull();
  });
});

describe("Punching Poro (ven-7)", () => {
  it("has no bonus while not Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-7", "0");

    expect(computeMight(game, getCard, unit, "none")).toBe(getCard(unit.cardId).might ?? 0);
  });

  it("has +1 Might once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-7", "0");
    unit.statuses.empowered = true;

    expect(computeMight(game, getCard, unit, "none")).toBe((getCard(unit.cardId).might ?? 0) + 1);
  });
});
