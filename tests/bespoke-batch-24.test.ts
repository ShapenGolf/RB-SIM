import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { makeGame, putOnBase } from "./helpers";

describe("Undertitan (sfd-175)", () => {
  it("gives other friendly units +2 Might this turn, but not itself", () => {
    const game = makeGame();
    const titan = putOnBase(game, "sfd-175", "0");
    const ally = putOnBase(game, "unit-doomed-recruit", "0");
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(titan.cardId);

    SpecialCaseEngine.onPlay(game, card, titan);
    expect(computeMight(game, getCard, ally, "none")).toBe(3);
    expect(titan.tempMightBonus).toBe(0);
    expect(enemy.tempMightBonus).toBe(0);
  });
});

describe("Overt Operation (ogn-153)", () => {
  it("spends buffs to ready exhausted buffed units, then buffs everyone", () => {
    const game = makeGame();
    const exhaustedBuffed = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    exhaustedBuffed.statuses.buffed = true;
    const readyUnbuffed = putOnBase(game, "token-tentacle", "0");
    const op = putOnBase(game, "ogn-153", "0");
    const card = getCard(op.cardId);

    SpecialCaseEngine.onPlay(game, card, op);
    expect(exhaustedBuffed.exhausted).toBe(false);
    expect(exhaustedBuffed.statuses.buffed).toBe(true);
    expect(readyUnbuffed.statuses.buffed).toBe(true);
  });
});

describe("Shadows of the Past (ven-103)", () => {
  it("returns up to 2 units from the controller's own trash to hand", () => {
    const game = makeGame();
    const sotp = putOnBase(game, "ven-103", "0");
    game.players["0"].trash = ["unit-doomed-recruit", "token-tentacle", "token-shadow-clone"];
    const card = getCard(sotp.cardId);

    SpecialCaseEngine.onPlay(game, card, sotp);
    expect(game.players["0"].trash.length).toBe(1);
    expect(game.players["0"].hand.length).toBe(2);
  });
});

describe("Undying Loyalty (unl-168)", () => {
  it("plays a <=2 Energy unit from trash ignoring cost", () => {
    const game = makeGame();
    const loyalty = putOnBase(game, "unl-168", "0");
    game.players["0"].trash = ["unit-doomed-recruit"];
    const card = getCard(loyalty.cardId);

    SpecialCaseEngine.onPlay(game, card, loyalty);
    expect(game.players["0"].trash).not.toContain("unit-doomed-recruit");
    expect(Object.values(game.instances).some((i) => i.cardId === "unit-doomed-recruit")).toBe(true);
  });
});

describe("Wallop (ogn-146)", () => {
  it("readies the strongest exhausted friendly unit", () => {
    const game = makeGame();
    const weak = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const strong = putOnBase(game, "unit-blazing-scorcher", "0", { exhausted: true });
    const wallopInst = putOnBase(game, "ogn-146", "0");
    const card = getCard(wallopInst.cardId);

    SpecialCaseEngine.onPlay(game, card, wallopInst);
    expect(strong.exhausted).toBe(false);
    expect(weak.exhausted).toBe(true);
  });
});

describe("Party Favors (ogn-71)", () => {
  it("draws 1 for both players", () => {
    const game = makeGame();
    const favors = putOnBase(game, "ogn-71", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    game.players["1"].mainDeck = ["token-tentacle"];
    const card = getCard(favors.cardId);

    SpecialCaseEngine.onPlay(game, card, favors);
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
    expect(game.players["1"].hand).toEqual(["token-tentacle"]);
  });
});
