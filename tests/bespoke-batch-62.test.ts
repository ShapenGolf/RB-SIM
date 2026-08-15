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

describe("Kai'Sa, Evolutionary (ogn-112)", () => {
  it("plays the priciest eligible spell from trash and recycles it", () => {
    const game = makeGame();
    const kaisa = putOnBase(game, "ogn-112", "0");
    game.players["0"].points = 5;
    game.players["0"].trash = ["spell-stunning-blow"]; // energyCost < 5
    const card = getCard(kaisa.cardId);

    SpecialCaseEngine.onConquer(game, card, kaisa, 3);

    expect(game.players["0"].trash).toEqual([]);
    expect(game.players["0"].mainDeck).toContain("spell-stunning-blow");
  });

  it("doesn't play a spell costing at or above current points", () => {
    const game = makeGame();
    const kaisa = putOnBase(game, "ogn-112", "0");
    game.players["0"].points = 0;
    game.players["0"].trash = ["spell-stunning-blow"];
    const card = getCard(kaisa.cardId);

    SpecialCaseEngine.onConquer(game, card, kaisa, 3);

    expect(game.players["0"].trash).toEqual(["spell-stunning-blow"]);
  });
});

describe("Kennen, Keeper of Balance (ven-135)", () => {
  it("offers a 2-Energy optional cost when played", () => {
    const game = makeGame();
    const kennen = putOnBattlefield(game, "ven-135", "0", 0);
    const card = getCard(kennen.cardId);

    SpecialCaseEngine.onPlay(game, card, kennen);

    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "kennen-keeper-of-balance",
      cost: { energy: 2 },
      payload: "0",
    });
  });

  it("stuns the strongest enemy unit once paid, and gains +2 Might while a stunned enemy is here", () => {
    const game = makeGame();
    const kennen = putOnBattlefield(game, "ven-135", "0", 0);
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(kennen.cardId);

    expect(SpecialCaseEngine.staticMightModifier(game, card, kennen)).toBe(0);

    SpecialCaseEngine.onOptionalCostPaid(game, "kennen-keeper-of-balance", "0", "0");

    expect(enemy.statuses.stunned).toBe(true);
    expect(SpecialCaseEngine.staticMightModifier(game, card, kennen)).toBe(2);
  });
});

describe("Masa, Crashing Thunder (ven-120)", () => {
  it("stuns an enemy unit if the additional cost was paid", () => {
    const game = makeGame();
    const masa = putOnBase(game, "ven-120", "0");
    masa.statuses.paidAdditionalCostThisTurn = true;
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(masa.cardId);

    SpecialCaseEngine.onPlay(game, card, masa);

    expect(enemy.statuses.stunned).toBe(true);
  });

  it("does nothing without the additional cost", () => {
    const game = makeGame();
    const masa = putOnBase(game, "ven-120", "0");
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(masa.cardId);

    SpecialCaseEngine.onPlay(game, card, masa);

    expect(enemy.statuses.stunned).toBeFalsy();
  });
});

describe("Mask Mother (ven-94)", () => {
  it("buffs the strongest friendly unit when discarded", () => {
    const game = makeGame();
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    SpecialCaseEngine.onSelfDiscarded(game, getCard, "0", "ven-94");
    expect(strong.tempMightBonus).toBe(2);
  });
});

describe("Meditation (ogn-48)", () => {
  it("exhausts the weakest ready friendly unit and draws 2", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-48", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    game.players["0"].mainDeck = ["unit-plain-footman", "unit-plain-guard"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(weak.exhausted).toBe(true);
    expect(strong.exhausted).toBe(false);
    expect(game.players["0"].hand.length).toBe(2);
  });

  it("draws only 1 with no ready friendly unit available", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-48", "0");
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand.length).toBe(1);
  });
});

describe("Mesmerize (ven-52)", () => {
  it("gives an enemy unit -2 Might this turn", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-52", "0");
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.tempMightBonus).toBe(-2);
  });
});
