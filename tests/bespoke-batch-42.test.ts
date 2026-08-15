import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { resolveCombat } from "../src/game/combat";
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

describe("Akali, Silent (ven-38)", () => {
  it("gains +2 Might this turn when it moves to a battlefield", () => {
    const game = makeGame();
    const akali = putOnBattlefield(game, "ven-38", "0", 0);
    const card = getCard(akali.cardId);

    SpecialCaseEngine.onMove(game, card, akali);
    expect(akali.tempMightBonus).toBe(2);
  });
});

describe("Akali, Deadly Weapon (ven-21)", () => {
  it("deals 1 to the weakest enemy unit at the destination when not Empowered", () => {
    const game = makeGame();
    const akali = putOnBattlefield(game, "ven-21", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(akali.cardId);

    SpecialCaseEngine.onMove(game, card, akali);
    expect(enemy.damage).toBe(1);
  });

  it("deals 2 when Empowered", () => {
    const game = makeGame();
    const akali = putOnBattlefield(game, "ven-21", "0", 0);
    akali.statuses.empowered = true;
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(akali.cardId);

    SpecialCaseEngine.onMove(game, card, akali);
    expect(enemy.damage).toBe(2);
    expect(SpecialCaseEngine.staticMightModifier(game, card, akali)).toBe(1);
  });
});

describe("Draven, Vanquisher (sfd-20)", () => {
  it("plays an exhausted Gold gear token when it wins a combat", () => {
    const game = makeGame();
    const draven = putOnBattlefield(game, "sfd-20", "0", 0);
    void draven;
    putOnBattlefield(game, "token-tentacle", "1", 0);

    resolveCombat(game, getCard, 0, "0");
    const token = Object.values(game.instances).find((i) => i.cardId === "token-gold-gear");
    expect(token).toBeDefined();
    expect(token?.exhausted).toBe(true);
  });
});
