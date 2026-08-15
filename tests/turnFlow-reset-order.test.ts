import { describe, it, expect } from "vitest";
import { runTurnStart } from "../src/game/turnFlow";
import { makeGame, putOnBase } from "./helpers";

describe("runTurnStart reset ordering", () => {
  it("lets an onBeginning hook's this-turn Might grant survive into the Main Phase", () => {
    const game = makeGame();
    // Forsaken Baccai (ven-5): "If you control fewer runes than an opponent at the start of your
    // Beginning Phase, give me +1 Might this turn." Regression test for a real bug: the
    // tempMightBonus/grantedThisTurn reset used to run AFTER Beginning inside the same
    // runTurnStart call, silently erasing grants made during that same turn's own Beginning
    // Phase — see turnFlow.ts runTurnStart.
    const baccai = putOnBase(game, "ven-5", "0");
    game.players["1"].runePool.push({ instanceId: "r0", domain: "Fury", exhausted: false });

    runTurnStart(game, "0");

    expect(game.turnPhase).toBe("main");
    expect(baccai.tempMightBonus).toBe(1);
  });

  it("still resets last turn's bonuses at the start of this turn", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-plain-footman", "0");
    unit.tempMightBonus = 5;

    runTurnStart(game, "0");

    expect(unit.tempMightBonus).toBe(0);
  });
});
