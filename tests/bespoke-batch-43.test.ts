import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { playTokenToBase } from "../src/cards/special-cases/token-helpers";
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

describe("Zilean, Time Mage (unl-86)", () => {
  it("duplicates a token unit played while it's at a battlefield, once per turn", () => {
    const game = makeGame();
    putOnBattlefield(game, "unl-86", "0", 0);

    playTokenToBase(game, "token-tentacle", "0");
    const tentacleCount = Object.values(game.instances).filter((i) => i.cardId === "token-tentacle").length;
    expect(tentacleCount).toBe(2);

    playTokenToBase(game, "token-tentacle", "0");
    const secondCount = Object.values(game.instances).filter((i) => i.cardId === "token-tentacle").length;
    expect(secondCount).toBe(3); // second play adds only 1 more — duplication already used this turn
  });

  it("doesn't duplicate while Zilean is only in base", () => {
    const game = makeGame();
    putOnBase(game, "unl-86", "0");

    playTokenToBase(game, "token-tentacle", "0");
    const count = Object.values(game.instances).filter((i) => i.cardId === "token-tentacle").length;
    expect(count).toBe(1);
  });

  it("no infinite recursion — duplicate creation doesn't itself get duplicated", () => {
    const game = makeGame();
    const zilean = putOnBattlefield(game, "unl-86", "0", 0);
    const card = getCard(zilean.cardId);

    expect(() => playTokenToBase(game, "token-tentacle", "0")).not.toThrow();
    expect(SpecialCaseEngine.staticMightModifier(game, card, zilean)).toBe(0); // sanity: handler is wired, no crash
  });
});
