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
