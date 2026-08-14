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

describe("Riven, Shattered (ven-171)", () => {
  it("deals 2 damage per attached Equipment to the first enemy here", () => {
    const game = makeGame();
    const riven = putOnBattlefield(game, "ven-171", "0", 0);
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const card = getCard(riven.cardId);
    riven.equipment = ["gear-instance-1"]; // 1 Equipment -> 2 damage, non-lethal to a Might-3 unit

    SpecialCaseEngine.onAttack(game, card, riven);

    expect(game.instances[enemy.instanceId]?.damage).toBe(2);
  });

  it("does nothing with no Equipment attached", () => {
    const game = makeGame();
    const riven = putOnBattlefield(game, "ven-171", "0", 0);
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(riven.cardId);

    SpecialCaseEngine.onAttack(game, card, riven);

    expect(game.instances[enemy.instanceId]?.damage).toBe(0);
  });
});

describe("Keeper of Law (ven-119)", () => {
  it("reduces cost by 2 only when the controller controls a battlefield with exactly 2 units", () => {
    const game = makeGame();
    const keeper = putOnBase(game, "ven-119", "0");
    const card = getCard(keeper.cardId);

    expect(SpecialCaseEngine.costReduction(game, card, keeper)).toBe(0);

    game.battlefields[0].controller = "0";
    putOnBattlefield(game, "unit-plain-footman", "0", 0);
    putOnBattlefield(game, "unit-plain-guard", "1", 0);
    expect(SpecialCaseEngine.costReduction(game, card, keeper)).toBe(2);
  });
});

describe("Guttural Roar (ven-72)", () => {
  it("gives +2 Might normally, +4 if the target is Empowered", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-plain-footman", "0");
    const spell = putOnBase(game, "ven-72", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);
    expect(target.tempMightBonus).toBe(2);

    target.statuses.empowered = true;
    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);
    expect(target.tempMightBonus).toBe(6);
  });
});

describe("Shen, Leader of the Kinkou Order (ven-138)", () => {
  it("scores 1 point when holding alongside exactly one other unit", () => {
    const game = makeGame();
    const shen = putOnBattlefield(game, "ven-138", "0", 0);
    const card = getCard(shen.cardId);

    SpecialCaseEngine.onHold(game, card, shen);
    expect(game.players["0"].points).toBe(0);

    putOnBattlefield(game, "unit-plain-footman", "0", 0);
    SpecialCaseEngine.onHold(game, card, shen);
    expect(game.players["0"].points).toBe(1);
  });
});

describe("Shen, Scourge of Shadows (ven-170)", () => {
  it("draws 1 when holding alongside exactly one other unit", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-guard"];
    const shen = putOnBattlefield(game, "ven-170", "0", 0);
    putOnBattlefield(game, "unit-plain-footman", "0", 0);
    const card = getCard(shen.cardId);

    SpecialCaseEngine.onHold(game, card, shen);

    expect(game.players["0"].hand).toEqual(["unit-plain-guard"]);
  });
});
