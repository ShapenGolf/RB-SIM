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

describe("Skyward Strike (unl-38)", () => {
  it("moves the strongest enemy unit at a battlefield to its base, without Level 6", () => {
    const game = makeGame();
    const strike = putOnBase(game, "unl-38", "0");
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(strike.cardId);

    SpecialCaseEngine.onPlay(game, card, strike);
    expect(enemy.zone).toBe("base");
    expect(game.players["1"].base).toContain(enemy.instanceId);
    expect(enemy.statuses.stunned).toBeFalsy();
  });

  it("also stuns the strongest remaining enemy unit at Level 6+", () => {
    const game = makeGame();
    const strike = putOnBase(game, "unl-38", "0");
    game.players["0"].xp = 6;
    const moved = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const stunTarget = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(strike.cardId);

    SpecialCaseEngine.onPlay(game, card, strike);
    expect(moved.zone).toBe("base");
    expect(stunTarget.statuses.stunned).toBe(true);
  });
});

describe("Wildclaw Shaman (ogn-147)", () => {
  it("spends another friendly unit's buff to buff and ready itself", () => {
    const game = makeGame();
    const buffedAlly = putOnBase(game, "unit-doomed-recruit", "0");
    buffedAlly.statuses.buffed = true;
    const shaman = putOnBase(game, "ogn-147", "0", { exhausted: true });
    const card = getCard(shaman.cardId);

    SpecialCaseEngine.onPlay(game, card, shaman);
    expect(buffedAlly.statuses.buffed).toBe(false);
    expect(shaman.statuses.buffed).toBe(true);
    expect(shaman.exhausted).toBe(false);
  });

  it("does nothing if no other friendly unit has a buff", () => {
    const game = makeGame();
    const shaman = putOnBase(game, "ogn-147", "0", { exhausted: true });
    const card = getCard(shaman.cardId);

    SpecialCaseEngine.onPlay(game, card, shaman);
    expect(shaman.statuses.buffed).toBeFalsy();
    expect(shaman.exhausted).toBe(true);
  });
});
