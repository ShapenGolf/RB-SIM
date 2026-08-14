import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Forsaken Baccai (ven-5)", () => {
  it("gains +1 Might at Beginning only when controlling fewer runes than the opponent", () => {
    const game = makeGame();
    const baccai = putOnBase(game, "ven-5", "0");
    const card = getCard(baccai.cardId);

    SpecialCaseEngine.onBeginning(game, card, baccai);
    expect(baccai.tempMightBonus).toBe(0);

    game.players["1"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    SpecialCaseEngine.onBeginning(game, card, baccai);
    expect(baccai.tempMightBonus).toBe(1);
  });
});

describe("Decree of Strength (ven-85)", () => {
  it("recycles the first Mind card from the opponent's hand", () => {
    const game = makeGame();
    game.players["1"].hand = ["unit-plain-footman", "ogn-89", "unit-plain-guard"]; // ogn-89 = Mind Rune
    const spell = putOnBase(game, "ven-85", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["1"].hand).toEqual(["unit-plain-footman", "unit-plain-guard"]);
    expect(game.players["1"].mainDeck).toContain("ogn-89");
  });

  it("does nothing if the opponent has no Mind card in hand", () => {
    const game = makeGame();
    game.players["1"].hand = ["unit-plain-footman"];
    const spell = putOnBase(game, "ven-85", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["1"].hand).toEqual(["unit-plain-footman"]);
  });
});

describe("Corrupt Enforcer (sfd-123)", () => {
  it("discards 1 on move and draws 1 on surviving combat", () => {
    const game = makeGame();
    const enforcer = putOnBase(game, "sfd-123", "0");
    const card = getCard(enforcer.cardId);
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].mainDeck = ["unit-plain-guard"];

    SpecialCaseEngine.onMove(game, card, enforcer);
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].trash).toEqual(["unit-plain-footman"]);

    SpecialCaseEngine.onSurviveCombat(game, card, enforcer);
    expect(game.players["0"].hand).toEqual(["unit-plain-guard"]);
  });
});
