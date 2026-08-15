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

describe("Brutal Hunter (ven-70)", () => {
  it("has no Might bonus and no Ganking while not Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-70", "0");
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.staticMightModifier(game, card, unit)).toBe(0);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, unit)).toBe(false);
  });

  it("gets +2 Might and Ganking once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-70", "0");
    unit.statuses.empowered = true;
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.staticMightModifier(game, card, unit)).toBe(2);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, unit)).toBe(true);
  });
});

describe("Ancient Warmonger (sfd-131)", () => {
  it("has Assault equal to the number of enemy units at its battlefield", () => {
    const game = makeGame();
    const warmonger = putOnBattlefield(game, "sfd-131", "0", 0);
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(warmonger.cardId);

    expect(SpecialCaseEngine.attackingMightModifier(game, card, warmonger)).toBe(2);
  });

  it("has no bonus with no enemies present", () => {
    const game = makeGame();
    const warmonger = putOnBattlefield(game, "sfd-131", "0", 0);
    const card = getCard(warmonger.cardId);

    expect(SpecialCaseEngine.attackingMightModifier(game, card, warmonger)).toBe(0);
  });
});

describe("Baccai Reaper (ven-9)", () => {
  it("offers a Fury-Rune cost on attack, granting Assault 2 this turn once paid", () => {
    const game = makeGame();
    const reaper = putOnBattlefield(game, "ven-9", "0", 0);
    const card = getCard(reaper.cardId);

    SpecialCaseEngine.onAttack(game, card, reaper);

    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "baccai-reaper",
      cost: { energy: 0, runeDomain: "Fury" },
      payload: reaper.instanceId,
    });

    SpecialCaseEngine.onOptionalCostPaid(game, "baccai-reaper", "0", reaper.instanceId);

    expect(reaper.grantedThisTurn).toContainEqual({ keyword: "assault", value: 2 });
  });

  it("doesn't offer a second cost while one is already pending", () => {
    const game = makeGame();
    const reaper = putOnBattlefield(game, "ven-9", "0", 0);
    game.pendingOptionalCost = { playerId: "1", specialCaseId: "other", cost: { energy: 1 } };
    const card = getCard(reaper.cardId);

    SpecialCaseEngine.onAttack(game, card, reaper);

    expect(game.pendingOptionalCost.specialCaseId).toBe("other");
  });
});

describe("Aurok General (ven-130)", () => {
  it("gives itself and other Empowered allies +2 Might, only while itself Empowered", () => {
    const game = makeGame();
    const general = putOnBase(game, "ven-130", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    ally.statuses.empowered = true;

    // Not Empowered yet: no bonus anywhere.
    expect(computeMight(game, getCard, general, "none")).toBe(getCard(general.cardId).might ?? 0);
    expect(computeMight(game, getCard, ally, "none")).toBe(getCard(ally.cardId).might ?? 0);

    general.statuses.empowered = true;

    expect(computeMight(game, getCard, general, "none")).toBe((getCard(general.cardId).might ?? 0) + 2);
    expect(computeMight(game, getCard, ally, "none")).toBe((getCard(ally.cardId).might ?? 0) + 2);
  });

  it("gives no bonus to an ally that isn't Empowered", () => {
    const game = makeGame();
    const general = putOnBase(game, "ven-130", "0");
    general.statuses.empowered = true;
    const ally = putOnBase(game, "unit-plain-footman", "0");

    expect(computeMight(game, getCard, ally, "none")).toBe(getCard(ally.cardId).might ?? 0);
  });
});

describe("Drag Under (sfd-164)", () => {
  it("kills a targeted unit at a battlefield", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const spell = putOnBase(game, "sfd-164", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("doesn't kill a unit sitting in base", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-doomed-recruit", "0");
    const spell = putOnBase(game, "sfd-164", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Fae Porter (sfd-125)", () => {
  it("offers a Chaos-Rune cost on move, moving the strongest ready base unit there once paid", () => {
    const game = makeGame();
    const porter = putOnBattlefield(game, "sfd-125", "0", 0);
    const weak = putOnBase(game, "unit-doomed-recruit", "0"); // Might 1
    const strong = putOnBase(game, "unit-blazing-scorcher", "0"); // Might 3
    const card = getCard(porter.cardId);

    SpecialCaseEngine.onMove(game, card, porter);
    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "fae-porter",
      cost: { energy: 0, runeDomain: "Chaos" },
      payload: "0",
    });

    SpecialCaseEngine.onOptionalCostPaid(game, "fae-porter", "0", "0");

    expect(strong.zone).toBe("battlefield");
    expect(strong.battlefieldIndex).toBe(0);
    expect(game.battlefields[0].units["0"]).toContain(strong.instanceId);
    expect(weak.zone).toBe("base");
  });

  it("doesn't offer the cost with no eligible base unit", () => {
    const game = makeGame();
    const porter = putOnBattlefield(game, "sfd-125", "0", 0);
    const card = getCard(porter.cardId);

    SpecialCaseEngine.onMove(game, card, porter);

    expect(game.pendingOptionalCost).toBeNull();
  });
});

describe("Imposing Challenger (unl-105)", () => {
  it("moves a weaker enemy unit here to the other battlefield when it moves", () => {
    const game = makeGame();
    const challenger = putOnBattlefield(game, "unl-105", "0", 0); // Might 5
    const weakEnemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const card = getCard(challenger.cardId);

    SpecialCaseEngine.onMove(game, card, challenger);

    expect(weakEnemy.battlefieldIndex).toBe(1);
    expect(game.battlefields[0].units["1"]).not.toContain(weakEnemy.instanceId);
    expect(game.battlefields[1].units["1"]).toContain(weakEnemy.instanceId);
  });

  it("doesn't move an enemy unit that isn't weaker", () => {
    const game = makeGame();
    const challenger = putOnBattlefield(game, "unl-105", "0", 0); // Might 5
    const strongEnemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3, still < 5 though
    strongEnemy.tempMightBonus = 5; // Might 8, now stronger than the challenger
    const card = getCard(challenger.cardId);

    SpecialCaseEngine.onMove(game, card, challenger);

    expect(strongEnemy.battlefieldIndex).toBe(0);
  });
});
