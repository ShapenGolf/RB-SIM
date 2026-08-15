import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
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

describe("Ambessa, Respected and Feared (ven-136)", () => {
  it("has no attacking bonus and doesn't kill while not Empowered", () => {
    const game = makeGame();
    const ambessa = putOnBattlefield(game, "ven-136", "0", 0);
    const weakEnemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(ambessa.cardId);

    expect(SpecialCaseEngine.attackingMightModifier(game, card, ambessa)).toBe(-2);

    SpecialCaseEngine.onAttack(game, card, ambessa);
    expect(game.instances[weakEnemy.instanceId]).toBeDefined();
  });

  it("has +2 attacking and kills a weaker enemy here once Empowered", () => {
    const game = makeGame();
    const ambessa = putOnBattlefield(game, "ven-136", "0", 0);
    ambessa.statuses.empowered = true;
    const weakEnemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(ambessa.cardId);

    expect(SpecialCaseEngine.attackingMightModifier(game, card, ambessa)).toBe(0);

    SpecialCaseEngine.onAttack(game, card, ambessa);
    expect(game.instances[weakEnemy.instanceId]).toBeUndefined();
  });
});

describe("Baccai Sandspinner (ven-1)", () => {
  it("costs 2 to Empower with 4 or fewer runes", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-1", "0");
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.empowerCost(game, card, unit)).toEqual({ energy: 2 });
  });

  it("costs 5 to Empower with more than 4 runes", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-1", "0");
    for (let i = 0; i < 5; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Fury", exhausted: false });
    }
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.empowerCost(game, card, unit)).toEqual({ energy: 5 });
  });
});

describe("Frostcoat Mother (ven-32)", () => {
  it("costs less to Empower for each rune controlled, floored at 0", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-32", "0");
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.empowerCost(game, card, unit)).toEqual({ energy: 12 });

    for (let i = 0; i < 15; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Calm", exhausted: false });
    }
    expect(SpecialCaseEngine.empowerCost(game, card, unit)).toEqual({ energy: 0 });
  });
});

describe("Grumpy Rockbear (ven-50)", () => {
  it("has no defending bonus while not Empowered (cancels flawed printed Shield 3)", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-50", "0");
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.defendingMightModifier(game, card, unit)).toBe(-3);
  });

  it("has no defending penalty once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-50", "0");
    unit.statuses.empowered = true;
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.defendingMightModifier(game, card, unit)).toBe(0);
  });
});

describe("Ambessa, Respected and Feared (ven-187, reused handler)", () => {
  it("resolves to the shared handler", () => {
    const card = getCard("ven-187");
    expect(card.specialCaseId).toBe("ambessa-respected-and-feared");
  });
});
