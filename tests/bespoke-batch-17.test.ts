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

describe("Breakneck Mech (sfd-71)", () => {
  it("enters ready with another Mech controlled", () => {
    const game = makeGame();
    const mech = putOnBase(game, "sfd-71", "0");
    const card = getCard(mech.cardId);

    expect(SpecialCaseEngine.selfEntersReady(game, card, mech)).toBe(false);

    putOnBase(game, "token-mech-3", "0");
    expect(SpecialCaseEngine.selfEntersReady(game, card, mech)).toBe(true);
  });
});

describe("Corrupted Dragon (ven-91)", () => {
  it("enters ready when score is far from the Victory Score", () => {
    const game = makeGame();
    const dragon = putOnBase(game, "ven-91", "0");
    const card = getCard(dragon.cardId);
    game.players["0"].points = 0;

    expect(SpecialCaseEngine.selfEntersReady(game, card, dragon)).toBe(true);
  });

  it("doesn't enter ready when score is close to the Victory Score", () => {
    const game = makeGame();
    const dragon = putOnBase(game, "ven-91", "0");
    const card = getCard(dragon.cardId);
    game.players["0"].points = 7; // within 3 of 8

    expect(SpecialCaseEngine.selfEntersReady(game, card, dragon)).toBe(false);
  });
});

describe("Draven, Audacious (sfd-148)", () => {
  it("scores 1 point the first time it wins a combat this turn, not the second", () => {
    const game = makeGame();
    const draven = putOnBase(game, "sfd-148", "0");
    const card = getCard(draven.cardId);

    SpecialCaseEngine.onSurviveCombat(game, card, draven);
    expect(game.players["0"].points).toBe(1);

    SpecialCaseEngine.onSurviveCombat(game, card, draven);
    expect(game.players["0"].points).toBe(1);
  });
});

describe("Jaull-Fish (sfd-103)", () => {
  it("costs 2 less per Mighty (5+ Might) unit controlled, excluding itself", () => {
    const game = makeGame();
    const fish = putOnBase(game, "sfd-103", "0"); // Might 6 — Mighty itself, but must not self-count
    const card = getCard(fish.cardId);

    expect(SpecialCaseEngine.costReduction(game, card, fish)).toBe(0);

    const mighty = putOnBase(game, "unit-blazing-scorcher", "0"); // Might 3
    mighty.tempMightBonus = 2; // Might 5, now Mighty

    expect(SpecialCaseEngine.costReduction(game, card, fish)).toBe(2);
  });
});

describe("Serene Ascetic (ven-30)", () => {
  it("has no defending bonus while not Empowered (cancels the flawed printed Shield 3)", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-30", "0");

    expect(computeMight(game, getCard, unit, "defending")).toBe(getCard(unit.cardId).might ?? 0);
  });

  it("has +3 Might while defending once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-30", "0");
    unit.statuses.empowered = true;

    expect(computeMight(game, getCard, unit, "defending")).toBe((getCard(unit.cardId).might ?? 0) + 3);
  });
});

describe("Solari Sunhawk (ven-122)", () => {
  it("has no bonus while not Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-122", "0");

    expect(computeMight(game, getCard, unit, "none")).toBe(getCard(unit.cardId).might ?? 0);
  });

  it("has +1 Might once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-122", "0");
    unit.statuses.empowered = true;

    expect(computeMight(game, getCard, unit, "none")).toBe((getCard(unit.cardId).might ?? 0) + 1);
  });
});

describe("Zed, From the Shadows (ven-169)", () => {
  it("plays a Shadow Clone token if the additional cost was paid", () => {
    const game = makeGame();
    const zed = putOnBattlefield(game, "ven-169", "0", 0);
    zed.statuses.paidAdditionalCostThisTurn = true;
    const card = getCard(zed.cardId);

    SpecialCaseEngine.onPlay(game, card, zed);

    const tokenId = game.battlefields[0].units["0"].find((id) => game.instances[id].cardId === "token-shadow-clone");
    expect(tokenId).toBeDefined();
  });

  it("doesn't play a token if the additional cost wasn't paid", () => {
    const game = makeGame();
    const zed = putOnBattlefield(game, "ven-169", "0", 0);
    const card = getCard(zed.cardId);

    SpecialCaseEngine.onPlay(game, card, zed);

    const tokenId = game.battlefields[0].units["0"].find((id) => game.instances[id].cardId === "token-shadow-clone");
    expect(tokenId).toBeUndefined();
  });
});
