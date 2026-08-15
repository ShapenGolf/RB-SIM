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

describe("Up from the Deep (ven-100)", () => {
  it("plays two 1 Might Tentacle tokens to base", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-100", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    const tentacles = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-tentacle");
    expect(tentacles).toHaveLength(2);
    for (const id of tentacles) {
      expect(getCard(game.instances[id].cardId).might).toBe(1);
    }
  });
});

describe("Vi, Destructive (ven-167)", () => {
  it("gives +1 Might this turn on activate", () => {
    const game = makeGame();
    const vi = putOnBase(game, "ven-167", "0");
    const card = getCard(vi.cardId);

    SpecialCaseEngine.onActivate(game, card, vi);

    expect(vi.tempMightBonus).toBe(1);
  });
});

describe("Vi, Hotheaded (unl-30)", () => {
  it("doubles her current Might this turn on activate", () => {
    const game = makeGame();
    const vi = putOnBase(game, "unl-30", "0");
    const card = getCard(vi.cardId);
    const before = card.might ?? 0;

    SpecialCaseEngine.onActivate(game, card, vi);

    expect(vi.tempMightBonus).toBe(before);
  });

  it("doubles again correctly starting from an already-boosted Might", () => {
    const game = makeGame();
    const vi = putOnBase(game, "unl-30", "0");
    vi.tempMightBonus = 2; // already boosted once, e.g. by another effect
    const card = getCard(vi.cardId);
    const currentTotal = (card.might ?? 0) + 2;

    SpecialCaseEngine.onActivate(game, card, vi);

    expect(vi.tempMightBonus).toBe(2 + currentTotal);
  });
});

describe("Tools of Empire (ven-77)", () => {
  it("gives +2 Might this turn while not Empowered", () => {
    const game = makeGame();
    const gear = putOnBase(game, "ven-77", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    const card = getCard(gear.cardId);

    SpecialCaseEngine.onActivate(game, card, gear, target.instanceId);

    expect(target.tempMightBonus).toBe(2);
  });

  it("gives +4 Might this turn while Empowered", () => {
    const game = makeGame();
    const gear = putOnBase(game, "ven-77", "0");
    gear.statuses.empowered = true;
    const target = putOnBase(game, "unit-plain-footman", "0");
    const card = getCard(gear.cardId);

    SpecialCaseEngine.onActivate(game, card, gear, target.instanceId);

    expect(target.tempMightBonus).toBe(4);
  });
});

describe("Siphoning Strike (ven-146)", () => {
  it("deals 4 with fewer than 7 runes", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const spell = putOnBase(game, "ven-146", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("deals 7 with 7+ runes", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    target.tempMightBonus = 10; // Might 13, survives 4 but not 7... actually still survives 7 too
    const spell = putOnBase(game, "ven-146", "0");
    for (let i = 0; i < 7; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Fury", exhausted: false });
    }
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(target.damage).toBe(7);
  });
});

describe("Ravenbloom Prefect (ven-102)", () => {
  it("banishes itself and an enemy gear that was just played", () => {
    const game = makeGame();
    const prefect = putOnBase(game, "ven-102", "0");
    const enemyGear = putOnBase(game, "gear-tactical-banner", "1");
    const gearCard = getCard(enemyGear.cardId);

    SpecialCaseEngine.onEnemyCardPlayed(game, getCard, "1", gearCard, enemyGear);

    expect(game.instances[prefect.instanceId]).toBeUndefined();
    expect(game.instances[enemyGear.instanceId]).toBeUndefined();
    expect(game.players["0"].banishment).toContain("ven-102");
    expect(game.players["1"].banishment).toContain("gear-tactical-banner");
  });

  it("doesn't trigger for a non-gear card", () => {
    const game = makeGame();
    const prefect = putOnBase(game, "ven-102", "0");
    const enemyUnit = putOnBase(game, "unit-doomed-recruit", "1");
    const unitCard = getCard(enemyUnit.cardId);

    SpecialCaseEngine.onEnemyCardPlayed(game, getCard, "1", unitCard, enemyUnit);

    expect(game.instances[prefect.instanceId]).toBeDefined();
  });
});
