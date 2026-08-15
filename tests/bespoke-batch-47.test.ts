import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
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

describe("Clash of Giants (unl-110)", () => {
  it("duels the controller's strongest unit against the opponent's weakest", () => {
    const game = makeGame();
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const weakEnemy = putOnBase(game, "unit-doomed-recruit", "1");
    const spell = putOnBase(game, "unl-110", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);
    expect(game.instances[weakEnemy.instanceId]).toBeUndefined();
    expect(game.instances[strong.instanceId].damage).toBe(1);
  });
});

describe("Dragon Form (ven-116)", () => {
  it("brings the weakest friendly unit's Might to 5", () => {
    const game = makeGame();
    const weak = putOnBase(game, "unit-doomed-recruit", "0"); // Might 1
    const spell = putOnBase(game, "ven-116", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);
    expect(computeMight(game, getCard, weak, "none")).toBe(5);
  });
});

describe("Lightning Rush (ven-156)", () => {
  it("draws the highest-cost card among the top 3 and trashes the rest", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-156", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher", "token-tentacle"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);
    expect(game.players["0"].hand).toEqual(["unit-blazing-scorcher"]);
    expect(game.players["0"].trash).toEqual(
      expect.arrayContaining(["unit-doomed-recruit", "token-tentacle"]),
    );
  });
});

describe("Twilight Shroud (ven-31)", () => {
  it("gives the strongest ready friendly unit +1 Might this turn", () => {
    const game = makeGame();
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const spell = putOnBase(game, "ven-31", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);
    expect(strong.tempMightBonus).toBe(1);
    expect(weak.tempMightBonus).toBe(0);
  });
});

describe("Twilight Step (ven-105)", () => {
  it("moves the strongest eligible (<=3 Might) enemy unit at a battlefield to base", () => {
    const game = makeGame();
    const eligible = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const tooStrong = putOnBattlefield(game, "unit-elusive-warden", "1", 0);
    tooStrong.tempMightBonus = 10;
    const spell = putOnBase(game, "ven-105", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);
    expect(eligible.zone).toBe("base");
    expect(tooStrong.zone).toBe("battlefield");
  });
});
