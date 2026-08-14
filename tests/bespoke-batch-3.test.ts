import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { moveInstanceToBase } from "../src/cards/special-cases/move-helpers";
import { makeGame, putOnBase } from "./helpers";

function putOnBattlefield(game: ReturnType<typeof makeGame>, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("moveInstanceToBase", () => {
  it("moves a unit from a battlefield to its controller's base", () => {
    const game = makeGame();
    const unit = putOnBattlefield(game, "unit-plain-footman", "0", 0);

    const moved = moveInstanceToBase(game, getCard, unit.instanceId);

    expect(moved).toBe(true);
    expect(unit.zone).toBe("base");
    expect(unit.battlefieldIndex).toBeNull();
    expect(game.players["0"].base).toContain(unit.instanceId);
    expect(game.battlefields[0].units["0"]).not.toContain(unit.instanceId);
  });

  it("is a no-op for a unit already in base", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-plain-footman", "0");
    expect(moveInstanceToBase(game, getCard, unit.instanceId)).toBe(false);
  });
});

describe("Determined Sentry (unl-111)", () => {
  it("blocks only itself from moving to base", () => {
    const game = makeGame();
    const sentry = putOnBattlefield(game, "unl-111", "0", 0);
    const ally = putOnBattlefield(game, "unit-plain-footman", "0", 0);

    expect(moveInstanceToBase(game, getCard, sentry.instanceId)).toBe(false);
    expect(sentry.zone).toBe("battlefield");

    expect(moveInstanceToBase(game, getCard, ally.instanceId)).toBe(true);
  });
});

describe("Minotaur Reckoner (sfd-14)", () => {
  it("blocks every unit from moving to base while in play", () => {
    const game = makeGame();
    putOnBase(game, "sfd-14", "0");
    const ally = putOnBattlefield(game, "unit-plain-footman", "0", 0);
    const enemy = putOnBattlefield(game, "unit-plain-guard", "1", 0);

    expect(moveInstanceToBase(game, getCard, ally.instanceId)).toBe(false);
    expect(moveInstanceToBase(game, getCard, enemy.instanceId)).toBe(false);
  });
});

describe("Vilemaw's Lair (ogn-295)", () => {
  it("blocks units from moving to base only from this specific battlefield", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "ogn-295", units: { "0": [], "1": [] }, controller: null };
    const hereUnit = putOnBattlefield(game, "unit-plain-footman", "0", 0);
    const elsewhereUnit = putOnBattlefield(game, "unit-plain-guard", "0", 1);

    expect(moveInstanceToBase(game, getCard, hereUnit.instanceId)).toBe(false);
    expect(moveInstanceToBase(game, getCard, elsewhereUnit.instanceId)).toBe(true);
  });
});

describe("Fight or Flight (ogn-168)", () => {
  it("moves the targeted unit at a battlefield to its base", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-plain-footman", "1", 0);
    const spell = putOnBase(game, "ogn-168", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(target.zone).toBe("base");
    expect(game.players["1"].base).toContain(target.instanceId);
  });
});

describe("Decree of Unity (ven-131)", () => {
  it("kills an enemy Chaos unit", () => {
    const game = makeGame();
    const chaosEnemy = putOnBase(game, "sfd-131", "1"); // Ancient Warmonger, domains: ["Chaos"]
    const spell = putOnBase(game, "ven-131", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, chaosEnemy.instanceId);

    expect(game.instances[chaosEnemy.instanceId]).toBeUndefined();
  });

  it("doesn't kill a non-Chaos or a friendly unit", () => {
    const game = makeGame();
    const nonChaosEnemy = putOnBase(game, "unit-plain-footman", "1"); // no domains
    const friendlyChaos = putOnBase(game, "sfd-131", "0");
    const spell = putOnBase(game, "ven-131", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, nonChaosEnemy.instanceId);
    expect(game.instances[nonChaosEnemy.instanceId]).toBeDefined();

    SpecialCaseEngine.onPlay(game, card, spell, friendlyChaos.instanceId);
    expect(game.instances[friendlyChaos.instanceId]).toBeDefined();
  });
});

describe("Downwell (sfd-147)", () => {
  it("returns all units and gear to their owners' hands, leaving other cards alone", () => {
    const game = makeGame();
    const unit0 = putOnBase(game, "unit-plain-footman", "0");
    const unit1 = putOnBattlefield(game, "unit-plain-guard", "1", 0);
    const gear = putOnBase(game, "gear-tactical-banner", "0");
    const spell = putOnBase(game, "sfd-147", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[unit0.instanceId]).toBeUndefined();
    expect(game.instances[unit1.instanceId]).toBeUndefined();
    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toEqual(expect.arrayContaining(["unit-plain-footman", "gear-tactical-banner"]));
    expect(game.players["1"].hand).toContain("unit-plain-guard");
    expect(game.battlefields[0].units["1"]).not.toContain(unit1.instanceId);
  });
});

describe("Plaza Guardian (ven-64)", () => {
  it("reduces its own cost by 1 per gear the controller controls", () => {
    const game = makeGame();
    const guardian = putOnBase(game, "ven-64", "0");
    const card = getCard(guardian.cardId);

    expect(SpecialCaseEngine.costReduction(game, card, guardian)).toBe(0);

    putOnBase(game, "gear-tactical-banner", "0");
    expect(SpecialCaseEngine.costReduction(game, card, guardian)).toBe(1);
  });
});
