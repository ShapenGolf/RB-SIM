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

describe("Called Shot (sfd-122)", () => {
  it("draws the top card and recycles the second to the bottom of the deck", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-122", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher", "unit-plain-footman"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
    expect(game.players["0"].mainDeck).toEqual(["unit-plain-footman", "unit-blazing-scorcher"]);
  });
});

describe("Clairvoyance (ven-56)", () => {
  it("draws 2 and sets pendingPredict", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-56", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher", "unit-plain-footman"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand.length).toBe(2);
    expect(game.players["0"].pendingPredict).toBe(5);
  });
});

describe("Clockwork Keeper (ogn-44)", () => {
  it("draws 1 if the additional cost was paid", () => {
    const game = makeGame();
    const keeper = putOnBase(game, "ogn-44", "0");
    keeper.statuses.paidAdditionalCostThisTurn = true;
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(keeper.cardId);

    SpecialCaseEngine.onPlay(game, card, keeper);

    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
  });

  it("doesn't draw if the additional cost wasn't paid", () => {
    const game = makeGame();
    const keeper = putOnBase(game, "ogn-44", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(keeper.cardId);

    SpecialCaseEngine.onPlay(game, card, keeper);

    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Convergent Mutation (ogn-108)", () => {
  it("raises the weakest friendly unit's Might to match the strongest", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-108", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const card = getCard(spell.cardId);
    const weakMight = getCard(weak.cardId).might ?? 0;
    const strongMight = getCard(strong.cardId).might ?? 0;

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(weak.tempMightBonus).toBe(strongMight - weakMight);
  });
});

describe("Curtain Call (unl-182)", () => {
  it("deals 2 to the weakest enemy unit at a battlefield when one exists", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-182", "0");
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.damage).toBe(2);
  });

  it("draws 1 if no enemy unit is at a battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-182", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
  });
});

describe("Dame the Despoiler (ven-79)", () => {
  it("matches the strongest unit's Might here and adds +1, only while Empowered", () => {
    const game = makeGame();
    const dame = putOnBattlefield(game, "ven-79", "0", 0);
    const strongEnemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(dame.cardId);

    SpecialCaseEngine.onAttack(game, card, dame);
    expect(dame.tempMightBonus).toBe(0);

    dame.statuses.empowered = true;
    SpecialCaseEngine.onAttack(game, card, dame);

    const dameMight = getCard(dame.cardId).might ?? 0;
    const enemyMight = getCard(strongEnemy.cardId).might ?? 0;
    const expectedBonus = Math.max(0, enemyMight - dameMight) + 1;
    expect(dame.tempMightBonus).toBe(expectedBonus);
  });
});

describe("Danger Zone (sfd-182)", () => {
  it("gives friendly Mechs +1 Might", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-182", "0");
    const mech = putOnBase(game, "ogn-56", "0"); // Adaptatron, tagged Mech
    const nonMech = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(mech.tempMightBonus).toBe(1);
    expect(nonMech.tempMightBonus).toBe(0);
  });
});
