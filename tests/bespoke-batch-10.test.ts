import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

function putOnBattlefield(game: ReturnType<typeof makeGame>, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Lacerate (ven-127)", () => {
  it("disempowers the target, then kills it if 3 Might or less afterward", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-empowered-champion", "0"); // Might 2, +2 while Empowered
    target.statuses.empowered = true;
    const spell = putOnBase(game, "ven-127", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("doesn't kill a unit that's still above 3 Might after disempowering", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-blazing-scorcher", "0"); // Might 3, not Empowered-dependent
    target.tempMightBonus = 3; // Might 6, well above threshold
    const spell = putOnBase(game, "ven-127", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Public Execution (ven-154)", () => {
  it("kills an enemy unit weaker than the controller's strongest unit", () => {
    const game = makeGame();
    putOnBase(game, "unit-blazing-scorcher", "0"); // Might 3, controller's reference unit
    const weakEnemy = putOnBase(game, "unit-doomed-recruit", "1"); // Might 1
    const spell = putOnBase(game, "ven-154", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, weakEnemy.instanceId);

    expect(game.instances[weakEnemy.instanceId]).toBeUndefined();
  });

  it("doesn't kill an enemy unit at least as strong as the controller's strongest unit", () => {
    const game = makeGame();
    putOnBase(game, "unit-doomed-recruit", "0"); // Might 1, controller's reference unit
    const strongEnemy = putOnBase(game, "unit-blazing-scorcher", "1"); // Might 3
    const spell = putOnBase(game, "ven-154", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, strongEnemy.instanceId);

    expect(game.instances[strongEnemy.instanceId]).toBeDefined();
  });
});

describe("Noxian Demolitionist (ven-80)", () => {
  it("kills an eligible enemy gear on conquer", () => {
    const game = makeGame();
    const demolitionist = putOnBase(game, "ven-80", "0"); // Might 1 printed
    demolitionist.tempMightBonus = 3; // Might 4, enough to afford the 2-cost gear below
    const enemyGear = putOnBase(game, "gear-tactical-banner", "1"); // energyCost 2
    const card = getCard(demolitionist.cardId);

    SpecialCaseEngine.onConquer(game, card, demolitionist, 0);

    expect(game.instances[enemyGear.instanceId]).toBeUndefined();
  });

  it("doesn't kill a gear that costs more than the demolitionist's Might", () => {
    const game = makeGame();
    const demolitionist = putOnBase(game, "ven-80", "0"); // Might 1 printed, no bonus
    const enemyGear = putOnBase(game, "gear-tactical-banner", "1"); // energyCost 2 > 1
    const card = getCard(demolitionist.cardId);

    SpecialCaseEngine.onConquer(game, card, demolitionist, 0);

    expect(game.instances[enemyGear.instanceId]).toBeDefined();
  });
});

describe("Corina Veraza (sfd-179)", () => {
  it("plays three 1-Might Recruit tokens at her location on move", () => {
    const game = makeGame();
    const corina = putOnBattlefield(game, "sfd-179", "0", 0);
    const card = getCard(corina.cardId);

    SpecialCaseEngine.onMove(game, card, corina);

    const tokenIds = game.battlefields[0].units["0"].filter((id) => id !== corina.instanceId);
    expect(tokenIds).toHaveLength(3);
    for (const id of tokenIds) {
      expect(game.instances[id].cardId).toBe("token-recruit");
    }
  });
});
