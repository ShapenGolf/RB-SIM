import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Void Assault (unl-202)", () => {
  it("moves a friendly unit and an enemy unit to the first uncontrolled battlefield", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    const spell = putOnBase(game, "unl-202", "0");
    const myUnit = putOnBase(game, "unit-doomed-recruit", "0");
    const enemyUnit = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(myUnit.zone).toBe("battlefield");
    expect(myUnit.battlefieldIndex).toBe(1);
    expect(enemyUnit.zone).toBe("battlefield");
    expect(enemyUnit.battlefieldIndex).toBe(1);
  });
});
