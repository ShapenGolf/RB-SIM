import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Dangerous Duo (Legion special case)", () => {
  it("only buffs the target if Legion's condition is active", () => {
    const game = makeGame();
    const ally = putOnBase(game, "unit-plain-footman", "0");
    const duo = putOnBase(game, "spell-dangerous-duo", "0");
    const card = getCard(duo.cardId);

    SpecialCaseEngine.onPlay(game, card, duo, ally.instanceId);
    expect(ally.tempMightBonus).toBe(0);

    game.players["0"].playedMainDeckCardThisTurn = true;
    SpecialCaseEngine.onPlay(game, card, duo, ally.instanceId);
    expect(ally.tempMightBonus).toBe(2);
  });

  it("does not buff an opponent's unit", () => {
    const game = makeGame();
    const enemyUnit = putOnBase(game, "unit-plain-footman", "1");
    const duo = putOnBase(game, "spell-dangerous-duo", "0");
    const card = getCard(duo.cardId);
    game.players["0"].playedMainDeckCardThisTurn = true;

    SpecialCaseEngine.onPlay(game, card, duo, enemyUnit.instanceId);
    expect(enemyUnit.tempMightBonus).toBe(0);
  });
});

describe("Doomed Recruit (Deathknell special case)", () => {
  it("draws a card for its controller when destroyed", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const recruit = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(recruit.cardId);

    SpecialCaseEngine.onDestroy(game, card, recruit);

    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
    expect(game.players["0"].mainDeck).toEqual([]);
  });
});

describe("Stunning Blow (targeted Stun special case)", () => {
  it("stuns an enemy unit but not an ally", () => {
    const game = makeGame();
    const enemyUnit = putOnBase(game, "unit-plain-footman", "1");
    const allyUnit = putOnBase(game, "unit-plain-guard", "0");
    const spell = putOnBase(game, "spell-stunning-blow", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, allyUnit.instanceId);
    expect(allyUnit.statuses.stunned).toBeUndefined();

    SpecialCaseEngine.onPlay(game, card, spell, enemyUnit.instanceId);
    expect(enemyUnit.statuses.stunned).toBe(true);
  });
});

describe("Empowered Champion (Empowered special case)", () => {
  it("grants +2 Might only while the Empowered status is active", () => {
    const game = makeGame();
    const champion = putOnBase(game, "unit-empowered-champion", "0");
    const card = getCard(champion.cardId);

    expect(SpecialCaseEngine.staticMightModifier(game, card, champion)).toBe(0);
    champion.statuses.empowered = true;
    expect(SpecialCaseEngine.staticMightModifier(game, card, champion)).toBe(2);
  });
});

describe("Tactical Banner (Gear static ally bonus)", () => {
  it("buffs allied attackers but not the opponent's", () => {
    const game = makeGame();
    putOnBase(game, "gear-tactical-banner", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1");

    expect(SpecialCaseEngine.attackingMightBonusFromAllies(game, getCard, ally)).toBe(1);
    expect(SpecialCaseEngine.attackingMightBonusFromAllies(game, getCard, enemy)).toBe(0);
  });
});
