import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { computeMight } from "../src/game/might";
import { makeGame, putOnBase } from "./helpers";

describe("Black Flame Altar (unl-208)", () => {
  it("gives +1 Might to a Temporary unit here while defending, but not attacking", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-208", units: { "0": [], "1": [] }, controller: null };

    const temp = putOnBase(game, "unit-plain-footman", "0");
    temp.statuses.temporary = true;
    temp.zone = "battlefield";
    temp.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(temp.instanceId);

    const defending = computeMight(game, getCard, temp, "defending");
    const attacking = computeMight(game, getCard, temp, "attacking");
    const none = computeMight(game, getCard, temp, "none");
    const base = getCard(temp.cardId).might ?? 0;

    expect(defending).toBe(base + 1);
    expect(attacking).toBe(base);
    expect(none).toBe(base);
  });

  it("gives no bonus to a unit here without Temporary", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-208", units: { "0": [], "1": [] }, controller: null };

    const unit = putOnBase(game, "unit-plain-footman", "0");
    unit.zone = "battlefield";
    unit.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(unit.instanceId);

    expect(computeMight(game, getCard, unit, "defending")).toBe(getCard(unit.cardId).might ?? 0);
  });
});

describe("Rengar, Trophy Hunter (ven-179, reused rengar-trophy-hunter handler)", () => {
  it("resolves to the shared Ambush-to-enemy-occupied handler", () => {
    const card = getCard("ven-179");
    expect(card.specialCaseId).toBe("rengar-trophy-hunter");
  });
});
