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

describe("Jagged Cutlass (ven-73) equip cost", () => {
  it("resolves to a Body Rune equip cost via the generic equip-cost parser", () => {
    const card = getCard("ven-73");
    expect(card.equipCost).toEqual({ energy: 0, runeDomain: "Body" });
  });
});

describe("Decree of Rage (ven-15)", () => {
  it("kills an enemy Calm unit with lethal damage", () => {
    const game = makeGame();
    const calmEnemy = putOnBase(game, "ogn-56", "1"); // Adaptatron, domains: ["Calm"], Might 3
    const spell = putOnBase(game, "ven-15", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, calmEnemy.instanceId);

    expect(game.instances[calmEnemy.instanceId]).toBeUndefined();
  });

  it("doesn't damage a non-Calm or a friendly unit", () => {
    const game = makeGame();
    const nonCalmEnemy = putOnBase(game, "unit-plain-footman", "1"); // no domains
    const friendlyCalm = putOnBase(game, "ogn-56", "0");
    const spell = putOnBase(game, "ven-15", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, nonCalmEnemy.instanceId);
    expect(game.instances[nonCalmEnemy.instanceId]).toBeDefined();

    SpecialCaseEngine.onPlay(game, card, spell, friendlyCalm.instanceId);
    expect(game.instances[friendlyCalm.instanceId]).toBeDefined();
  });
});

describe("Fiora, Peerless (sfd-110)", () => {
  it("doubles her Might when attacking one on one, not in a group fight", () => {
    const game = makeGame();
    const fiora = putOnBattlefield(game, "sfd-110", "0", 0);
    putOnBattlefield(game, "unit-plain-footman", "1", 0);
    const fioraCard = getCard(fiora.cardId);
    const baseMight = fioraCard.might ?? 0;

    SpecialCaseEngine.onAttack(game, fioraCard, fiora);
    expect(fiora.tempMightBonus).toBe(baseMight);
  });

  it("doesn't double her Might when a second enemy unit is also here", () => {
    const game = makeGame();
    const fiora = putOnBattlefield(game, "sfd-110", "0", 0);
    putOnBattlefield(game, "unit-plain-footman", "1", 0);
    putOnBattlefield(game, "unit-plain-guard", "1", 0);
    const fioraCard = getCard(fiora.cardId);

    SpecialCaseEngine.onAttack(game, fioraCard, fiora);
    expect(fiora.tempMightBonus).toBe(0);
  });
});

describe("Towering Pairofant (unl-8)", () => {
  it("enters ready only if a unit died this turn", () => {
    const game = makeGame();
    const pairofant = putOnBase(game, "unl-8", "0");
    const card = getCard(pairofant.cardId);

    expect(SpecialCaseEngine.selfEntersReady(game, card, pairofant)).toBe(false);

    game.anyUnitDiedThisTurn = true;
    expect(SpecialCaseEngine.selfEntersReady(game, card, pairofant)).toBe(true);
  });
});
