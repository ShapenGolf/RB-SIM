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

describe("Evelynn, Entrancing (unl-141)", () => {
  it("moves an enemy unit from a different battlefield to hers", () => {
    const game = makeGame();
    const evelynn = putOnBattlefield(game, "unl-141", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 1);
    const card = getCard(evelynn.cardId);

    SpecialCaseEngine.onPlay(game, card, evelynn);

    expect(enemy.battlefieldIndex).toBe(0);
  });

  it("doesn't move an enemy unit already at her battlefield", () => {
    const game = makeGame();
    const evelynn = putOnBattlefield(game, "unl-141", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(evelynn.cardId);

    SpecialCaseEngine.onPlay(game, card, evelynn);

    expect(enemy.battlefieldIndex).toBe(0);
  });
});

describe("Ezreal, Dashing (sfd-82)", () => {
  it("deals damage equal to his Might to the strongest enemy unit here on attack", () => {
    const game = makeGame();
    const ezreal = putOnBattlefield(game, "sfd-82", "0", 0);
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(ezreal.cardId);
    const ezrealMight = getCard(ezreal.cardId).might ?? 0;

    SpecialCaseEngine.onAttack(game, card, ezreal);

    expect(enemy.damage).toBe(ezrealMight);
  });

  it("prevents his own combat damage", () => {
    const game = makeGame();
    const ezreal = putOnBase(game, "sfd-82", "0");
    const card = getCard(ezreal.cardId);
    expect(SpecialCaseEngine.preventsCombatDamage(game, card, ezreal)).toBe(true);
  });

  it("moves to base via the Mind Rune activated ability", () => {
    const game = makeGame();
    const ezreal = putOnBattlefield(game, "sfd-82", "0", 0);
    const card = getCard(ezreal.cardId);

    SpecialCaseEngine.onActivate(game, card, ezreal);

    expect(ezreal.zone).toBe("base");
  });
});

describe("Flurry of Feathers (unl-44)", () => {
  it("plays four Bird tokens with Deflect", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-44", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    const tokens = Object.values(game.instances).filter((i) => i.cardId === "token-bird-deflect" && i.controller === "0");
    expect(tokens.length).toBe(4);
  });
});
