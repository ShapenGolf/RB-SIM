import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { computeMight } from "../src/game/might";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Shadow Fiend (ven-14)", () => {
  it("has no attacking bonus while not Empowered, cancelling the flawed printed Assault 3", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-14", "0");
    const card = getCard(unit.cardId);

    expect(computeMight(game, getCard, unit, "attacking")).toBe(card.might ?? 0);
  });

  it("has +3 Might while attacking once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-14", "0");
    unit.statuses.empowered = true;
    const card = getCard(unit.cardId);

    expect(computeMight(game, getCard, unit, "attacking")).toBe((card.might ?? 0) + 3);
  });
});

describe("Repair Specialist (ven-76)", () => {
  it("has Assault equal to the number of gear controlled, not the flawed printed Assault 1", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-76", "0");
    const card = getCard(unit.cardId);

    // Checked via the special-case delta directly (not full computeMight), since the only real
    // gear fixture available (gear-tactical-banner) has its own attacking Might bonus for allies
    // that would otherwise contaminate this assertion.
    expect(SpecialCaseEngine.attackingMightModifier(game, card, unit)).toBe(-1);

    putOnBase(game, "gear-tactical-banner", "0");
    putOnBase(game, "gear-tactical-banner", "0");

    expect(SpecialCaseEngine.attackingMightModifier(game, card, unit)).toBe(1);
  });
});

describe("Sacred Protector (ven-129)", () => {
  it("prevents combat damage unless with exactly one other controlled unit here", () => {
    const game = makeGame();
    const protector = putOnBattlefield(game, "ven-129", "0", 0);
    const card = getCard(protector.cardId);

    expect(SpecialCaseEngine.preventsCombatDamage(game, card, protector)).toBe(true);

    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    expect(SpecialCaseEngine.preventsCombatDamage(game, card, protector)).toBe(false);

    putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    expect(SpecialCaseEngine.preventsCombatDamage(game, card, protector)).toBe(true);
  });
});

describe("Royal Entourage (sfd-39)", () => {
  it("readies the controller's exhausted legend when played", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-230", exhausted: true };
    const entourage = putOnBase(game, "sfd-39", "0");
    const card = getCard(entourage.cardId);

    SpecialCaseEngine.onPlay(game, card, entourage);

    expect(game.players["0"].legend?.exhausted).toBe(false);
  });
});

describe("Morgana, Vindictive (ven-186)", () => {
  it("deals damage equal to the target's marked damage", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    target.damage = 2;
    const morgana = putOnBase(game, "ven-186", "0");
    const card = getCard(morgana.cardId);

    SpecialCaseEngine.onPlay(game, card, morgana, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("does nothing to an undamaged unit", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const morgana = putOnBase(game, "ven-186", "0");
    const card = getCard(morgana.cardId);

    SpecialCaseEngine.onPlay(game, card, morgana, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
    expect(target.damage).toBe(0);
  });
});

describe("Shock Blast (ven-59)", () => {
  it("costs 2 less while controlling something Empowered", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-59", "0");
    const card = getCard(spell.cardId);

    expect(SpecialCaseEngine.costReduction(game, card, spell)).toBe(0);

    const empowered = putOnBase(game, "unit-plain-footman", "0");
    empowered.statuses.empowered = true;

    expect(SpecialCaseEngine.costReduction(game, card, spell)).toBe(2);
  });

  it("deals 4 damage to a unit at a battlefield", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const spell = putOnBase(game, "ven-59", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("doesn't damage a unit sitting in base", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-doomed-recruit", "1");
    const spell = putOnBase(game, "ven-59", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Shadow Order Disciple (ven-95)", () => {
  it("burns 1 to gain +1 Might this turn on move", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher"];
    const disciple = putOnBattlefield(game, "ven-95", "0", 0);
    const card = getCard(disciple.cardId);

    SpecialCaseEngine.onMove(game, card, disciple);

    expect(disciple.tempMightBonus).toBe(1);
    expect(game.players["0"].trash).toEqual(["unit-doomed-recruit"]);
    expect(game.players["0"].mainDeck).toEqual(["unit-blazing-scorcher"]);
  });

  it("does nothing with an empty deck", () => {
    const game = makeGame();
    game.players["0"].mainDeck = [];
    const disciple = putOnBattlefield(game, "ven-95", "0", 0);
    const card = getCard(disciple.cardId);

    SpecialCaseEngine.onMove(game, card, disciple);

    expect(disciple.tempMightBonus).toBe(0);
  });
});
