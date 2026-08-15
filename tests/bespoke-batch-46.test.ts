import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { battlefieldPseudoInstance } from "../src/game/pseudoInstance";
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

describe("Hall of Legends (sfd-210)", () => {
  it("readies the conquering player's Legend for free", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "sfd-210", units: { "0": [], "1": [] }, controller: "0" };
    game.players["0"].legend = { cardId: "ogs-17", exhausted: true };
    const card = getCard("sfd-210");

    SpecialCaseEngine.onConquerHere(game, card, battlefieldPseudoInstance("sfd-210", "0", 0), [], 0);
    expect(game.players["0"].legend?.exhausted).toBe(false);
  });
});

describe("Amateur Recital (unl-207)", () => {
  it("moves the strongest enemy unit at any battlefield to its base, for the holder", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-207", units: { "0": [], "1": [] }, controller: "0" };
    const weakEnemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 1);
    const strongEnemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 1);
    const card = getCard("unl-207");

    SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance("unl-207", "0", 0));
    expect(strongEnemy.zone).toBe("base");
    expect(weakEnemy.zone).toBe("battlefield");
  });

  it("does nothing if there's no enemy unit at any battlefield", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-207", units: { "0": [], "1": [] }, controller: "0" };
    const card = getCard("unl-207");
    expect(() =>
      SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance("unl-207", "0", 0)),
    ).not.toThrow();
  });
});
