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

describe("Challenge (ogn-128)", () => {
  it("duels the controller's strongest unit against the opponent's weakest, killing the weaker side", () => {
    const game = makeGame();
    const strong = putOnBase(game, "unit-blazing-scorcher", "0"); // Might 3
    const weakEnemy = putOnBase(game, "unit-doomed-recruit", "1"); // Might 1
    const challengeInst = putOnBase(game, "ogn-128", "0");
    const card = getCard(challengeInst.cardId);

    SpecialCaseEngine.onPlay(game, card, challengeInst);
    expect(game.instances[weakEnemy.instanceId]).toBeUndefined();
    expect(game.instances[strong.instanceId]).toBeDefined();
    expect(game.instances[strong.instanceId].damage).toBe(1);
  });
});

describe("Gentlemen's Duel (ogs-8)", () => {
  it("buffs the controller's strongest unit +3 then duels it against the weakest enemy", () => {
    const game = makeGame();
    const friendly = putOnBase(game, "unit-doomed-recruit", "0"); // Might 1 -> 4 after buff
    const enemy = putOnBase(game, "unit-doomed-recruit", "1"); // Might 1
    const duel = putOnBase(game, "ogs-8", "0");
    const card = getCard(duel.cardId);

    SpecialCaseEngine.onPlay(game, card, duel);
    expect(game.instances[enemy.instanceId]).toBeUndefined();
    expect(game.instances[friendly.instanceId]).toBeDefined();
    expect(game.instances[friendly.instanceId].damage).toBe(1);
  });
});

describe("Marching Orders (sfd-114)", () => {
  it("duels the strongest friendly unit against the weakest enemy unit at a battlefield only", () => {
    const game = makeGame();
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const baseEnemy = putOnBase(game, "unit-doomed-recruit", "1"); // in base: not eligible
    const battlefieldEnemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const marching = putOnBase(game, "sfd-114", "0");
    const card = getCard(marching.cardId);

    SpecialCaseEngine.onPlay(game, card, marching);
    expect(game.instances[baseEnemy.instanceId]).toBeDefined();
    expect(game.instances[battlefieldEnemy.instanceId]).toBeUndefined();
    expect(game.instances[strong.instanceId].damage).toBe(1);
  });
});

describe("Cataclysmic Duel (ven-90)", () => {
  it("keeps each player's strongest unit and kills the rest", () => {
    const game = makeGame();
    const strongA = putOnBase(game, "unit-blazing-scorcher", "0");
    const weakA = putOnBase(game, "unit-doomed-recruit", "0");
    const strongB = putOnBase(game, "unit-elusive-warden", "1");
    const weakB = putOnBase(game, "unit-doomed-recruit", "1");
    const duel = putOnBase(game, "ven-90", "0");
    const card = getCard(duel.cardId);

    SpecialCaseEngine.onPlay(game, card, duel);
    expect(game.instances[strongA.instanceId]).toBeDefined();
    expect(game.instances[strongB.instanceId]).toBeDefined();
    expect(game.instances[weakA.instanceId]).toBeUndefined();
    expect(game.instances[weakB.instanceId]).toBeUndefined();
  });

  it("leaves a player with a single unit untouched", () => {
    const game = makeGame();
    const only = putOnBase(game, "unit-doomed-recruit", "0");
    const duel = putOnBase(game, "ven-90", "0");
    const card = getCard(duel.cardId);

    SpecialCaseEngine.onPlay(game, card, duel);
    expect(game.instances[only.instanceId]).toBeDefined();
  });
});

describe("Blade Twirler (ven-2)", () => {
  it("burns the opponent's deck the first time it moves each turn, not the second", () => {
    const game = makeGame();
    const twirler = putOnBase(game, "ven-2", "0");
    game.players["1"].mainDeck = ["unit-doomed-recruit", "token-tentacle"];
    const card = getCard(twirler.cardId);

    SpecialCaseEngine.onMove(game, card, twirler);
    expect(game.players["1"].mainDeck).toEqual(["token-tentacle"]);
    expect(game.players["1"].trash).toContain("unit-doomed-recruit");

    SpecialCaseEngine.onMove(game, card, twirler);
    expect(game.players["1"].mainDeck).toEqual(["token-tentacle"]);
  });
});
