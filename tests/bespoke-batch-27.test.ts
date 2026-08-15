import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { empowerInstance } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("Legion Marauder (ven-74)", () => {
  it("empowers for 1 Energy and gains +1 Might", () => {
    const game = makeGame();
    const marauder = putOnBase(game, "ven-74", "0");
    game.players["0"].runePool.push({ instanceId: "e0", domain: "Body", exhausted: false });
    const card = getCard(marauder.cardId);

    const result = empowerInstance(ctx(game, "0"), { instanceId: marauder.instanceId, energyRuneIds: ["e0"] });

    expect(result).toBeUndefined();
    expect(SpecialCaseEngine.staticMightModifier(game, card, marauder)).toBe(1);
  });
});

describe("Mournful Witness (ven-28)", () => {
  it("becomes Empowered for free when it survives a combat", () => {
    const game = makeGame();
    const witness = putOnBase(game, "ven-28", "0");
    const card = getCard(witness.cardId);
    expect(SpecialCaseEngine.staticMightModifier(game, card, witness)).toBe(0);

    SpecialCaseEngine.onSurviveCombat(game, card, witness);
    expect(witness.statuses.empowered).toBe(true);
    expect(witness.statuses.everEmpowered).toBe(true);
    expect(SpecialCaseEngine.staticMightModifier(game, card, witness)).toBe(2);
  });
});

describe("Super Mega Death Rocket! (ogn-252)", () => {
  it("kills the strongest enemy unit it can (Might <= 5)", () => {
    const game = makeGame();
    const rocket = putOnBase(game, "ogn-252", "0");
    const killable = putOnBase(game, "unit-blazing-scorcher", "1"); // Might 3
    const tooTough = putOnBase(game, "unit-doomed-recruit", "1"); // Might 1, would also die but weaker
    const card = getCard(rocket.cardId);

    SpecialCaseEngine.onPlay(game, card, rocket);
    expect(game.instances[killable.instanceId]).toBeUndefined();
    expect(game.instances[tooTough.instanceId]).toBeDefined();
  });

  it("still hits the (sole) weakest enemy unit even if the hit wouldn't kill it", () => {
    const game = makeGame();
    const rocket = putOnBase(game, "ogn-252", "0");
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    enemy.tempMightBonus = 10; // pushes it above the 5-damage kill threshold
    const card = getCard(rocket.cardId);

    SpecialCaseEngine.onPlay(game, card, rocket);
    expect(game.instances[enemy.instanceId]).toBeDefined();
    expect(game.instances[enemy.instanceId].damage).toBe(5);
  });
});
