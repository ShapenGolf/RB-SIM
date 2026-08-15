import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Insightful Investigator (unl-135)", () => {
  it("spends 2 XP to discard the opponent's most expensive hand card and they draw 1", () => {
    const game = makeGame();
    const investigator = putOnBase(game, "unl-135", "0");
    game.players["0"].xp = 2;
    game.players["1"].hand = ["unit-doomed-recruit", "unit-blazing-scorcher"];
    game.players["1"].mainDeck = ["token-tentacle"];
    const card = getCard(investigator.cardId);

    SpecialCaseEngine.onPlay(game, card, investigator);
    expect(game.players["0"].xp).toBe(0);
    expect(game.players["1"].hand).toEqual(["unit-doomed-recruit", "token-tentacle"]);
    expect(game.players["1"].trash).toEqual(["unit-blazing-scorcher"]);
  });

  it("does nothing without enough XP", () => {
    const game = makeGame();
    const investigator = putOnBase(game, "unl-135", "0");
    game.players["0"].xp = 1;
    game.players["1"].hand = ["unit-doomed-recruit"];
    const card = getCard(investigator.cardId);

    SpecialCaseEngine.onPlay(game, card, investigator);
    expect(game.players["1"].hand).toEqual(["unit-doomed-recruit"]);
  });
});

describe("Profiteer (ven-82)", () => {
  it("disempowers an empowered friendly unit to empower the strongest not-yet-empowered one", () => {
    const game = makeGame();
    const profiteerInst = putOnBase(game, "ven-82", "0");
    const empowered = putOnBase(game, "unit-doomed-recruit", "0");
    empowered.statuses.empowered = true;
    empowered.statuses.everEmpowered = true;
    const weak = putOnBase(game, "token-tentacle", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    strong.tempMightBonus = 10; // ensure it's strictly the strongest eligible target, ahead of Profiteer herself
    const card = getCard(profiteerInst.cardId);

    SpecialCaseEngine.onPlay(game, card, profiteerInst);
    expect(empowered.statuses.empowered).toBe(false);
    expect(strong.statuses.empowered).toBe(true);
    expect(weak.statuses.empowered).toBeFalsy();
    expect(profiteerInst.statuses.empowered).toBeFalsy();
  });

  it("does nothing if no friendly unit is currently empowered", () => {
    const game = makeGame();
    const profiteerInst = putOnBase(game, "ven-82", "0");
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(profiteerInst.cardId);

    SpecialCaseEngine.onPlay(game, card, profiteerInst);
    expect(unit.statuses.empowered).toBeFalsy();
  });
});
