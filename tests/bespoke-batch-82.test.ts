import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { destroyInstance } from "../src/game/combat";
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

describe("Soraka, Wanderer (sfd-239 / sfd-173)", () => {
  it("shares the same handler across both reprints", () => {
    expect(getCard("sfd-239").specialCaseId).toBe("soraka-wanderer");
    expect(getCard("sfd-173").specialCaseId).toBe("soraka-wanderer");
  });

  it("must be assigned combat damage last (conditional Backline)", () => {
    const game = makeGame();
    const soraka = putOnBattlefield(game, "sfd-239", "0", 0);
    const card = getCard(soraka.cardId);
    expect(SpecialCaseEngine.hasConditionalBackline(game, card, soraka)).toBe(true);
  });

  it("saves a weaker ally at the same battlefield from dying, recalling it exhausted", () => {
    const game = makeGame();
    const soraka = putOnBattlefield(game, "sfd-239", "0", 0); // Might 3
    const weakling = putOnBattlefield(game, "unit-doomed-recruit", "0", 0); // Might 1

    destroyInstance(game, getCard, weakling.instanceId);

    expect(game.instances[weakling.instanceId]).toBeDefined();
    expect(weakling.zone).toBe("base");
    expect(weakling.exhausted).toBe(true);
    expect(weakling.damage).toBe(0);
  });

  it("does not save an ally with equal Might (a second copy of Soraka herself)", () => {
    const game = makeGame();
    putOnBattlefield(game, "sfd-239", "0", 0); // Might 4
    const other = putOnBattlefield(game, "sfd-239", "0", 0); // Might 4, equal — not strictly less

    destroyInstance(game, getCard, other.instanceId);

    expect(game.instances[other.instanceId]).toBeUndefined();
  });

  it("does not save an ally at a different battlefield", () => {
    const game = makeGame();
    putOnBattlefield(game, "sfd-239", "0", 0);
    const elsewhere = putOnBattlefield(game, "unit-doomed-recruit", "0", 1);

    destroyInstance(game, getCard, elsewhere.instanceId);

    expect(game.instances[elsewhere.instanceId]).toBeUndefined();
  });

  it("does not save an enemy unit", () => {
    const game = makeGame();
    putOnBattlefield(game, "sfd-239", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);

    destroyInstance(game, getCard, enemy.instanceId);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });
});

describe("Unlicensed Armory (ogn-23)", () => {
  it("sets preventNextDeathThisTurn on the chosen friendly unit", () => {
    const game = makeGame();
    const gear = putOnBase(game, "ogn-23", "0");
    const target = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(gear.cardId);

    SpecialCaseEngine.onActivate(game, card, gear, target.instanceId);

    expect(target.statuses.preventNextDeathThisTurn).toBe(true);

    destroyInstance(game, getCard, target.instanceId);
    expect(game.instances[target.instanceId]).toBeDefined();
    expect(target.zone).toBe("base");
    expect(target.exhausted).toBe(true);
  });

  it("does nothing without a valid friendly target", () => {
    const game = makeGame();
    const gear = putOnBase(game, "ogn-23", "0");
    const card = getCard(gear.cardId);
    expect(() => SpecialCaseEngine.onActivate(game, card, gear)).not.toThrow();

    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    SpecialCaseEngine.onActivate(game, card, gear, enemy.instanceId);
    expect(enemy.statuses.preventNextDeathThisTurn).toBeUndefined();
  });
});

describe("Zhonya's Hourglass (ogn-77)", () => {
  it("kills itself and recalls the dying ally exhausted instead", () => {
    const game = makeGame();
    const gear = putOnBase(game, "ogn-77", "0");
    const ally = putOnBase(game, "unit-doomed-recruit", "0");

    destroyInstance(game, getCard, ally.instanceId);

    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(game.instances[ally.instanceId]).toBeDefined();
    expect(ally.zone).toBe("base");
    expect(ally.exhausted).toBe(true);
    expect(ally.damage).toBe(0);
  });

  it("is single-use: a second death this turn is not saved", () => {
    const game = makeGame();
    putOnBase(game, "ogn-77", "0");
    const first = putOnBase(game, "unit-doomed-recruit", "0");
    const second = putOnBase(game, "unit-vanguard-striker", "0");

    destroyInstance(game, getCard, first.instanceId);
    expect(game.instances[first.instanceId]).toBeDefined();

    destroyInstance(game, getCard, second.instanceId);
    expect(game.instances[second.instanceId]).toBeUndefined();
  });

  it("does not save an enemy unit", () => {
    const game = makeGame();
    putOnBase(game, "ogn-77", "0");
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");

    destroyInstance(game, getCard, enemy.instanceId);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });
});
