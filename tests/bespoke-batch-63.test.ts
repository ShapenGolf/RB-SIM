import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { FnContext } from "boardgame.io";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Kha'Zix, Evolving Hunter (ven-180 / unl-119)", () => {
  it("spends 3 XP to deal Might damage to the strongest enemy unit here on attack", () => {
    const game = makeGame();
    const khazix = putOnBattlefield(game, "ven-180", "0", 0);
    game.players["0"].xp = 3;
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(khazix.cardId);
    const khazixMight = getCard(khazix.cardId).might ?? 0;

    SpecialCaseEngine.onAttack(game, card, khazix);

    expect(game.players["0"].xp).toBe(0);
    expect(enemy.damage).toBe(khazixMight);
  });

  it("does nothing without enough XP", () => {
    const game = makeGame();
    const khazix = putOnBattlefield(game, "ven-180", "0", 0);
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(khazix.cardId);

    SpecialCaseEngine.onAttack(game, card, khazix);

    expect(enemy.damage).toBe(0);
  });

  it("shares the same handler between both reprints", () => {
    expect(getCard("ven-180").specialCaseId).toBe(getCard("unl-119").specialCaseId);
  });
});

describe("Morgana, Vindictive reprint (ven-17)", () => {
  it("shares the same handler as ven-186", () => {
    expect(getCard("ven-17").specialCaseId).toBe(getCard("ven-186").specialCaseId);
  });
});

describe("Nami, Headstrong (unl-52)", () => {
  it("stuns an enemy unit if the additional cost was paid", () => {
    const game = makeGame();
    const nami = putOnBase(game, "unl-52", "0");
    nami.statuses.paidAdditionalCostThisTurn = true;
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(nami.cardId);

    SpecialCaseEngine.onPlay(game, card, nami);

    expect(enemy.statuses.stunned).toBe(true);
  });

  it("sets nextUnitEntersReady and nextUnitBuffed on hold", () => {
    const game = makeGame();
    const nami = putOnBase(game, "unl-52", "0");
    const card = getCard(nami.cardId);

    SpecialCaseEngine.onHold(game, card, nami);

    expect(game.players["0"].nextUnitEntersReady).toBe(true);
    expect(game.players["0"].nextUnitBuffed).toBe(true);
  });

  it("the next unit played enters ready and buffed via playCard", () => {
    const game = makeGame();
    game.players["0"].nextUnitEntersReady = true;
    game.players["0"].nextUnitBuffed = true;
    game.players["0"].hand = ["unit-doomed-recruit"];
    game.players["0"].runePool.push({ instanceId: "e0", domain: "Mind", exhausted: false });

    playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["e0"], powerRuneIds: [] });

    const played = Object.values(game.instances).find((i) => i.cardId === "unit-doomed-recruit" && i.controller === "0");
    expect(played).toBeDefined();
    expect(played!.exhausted).toBe(false);
    expect(played!.statuses.buffed).toBe(true);
    expect(game.players["0"].nextUnitBuffed).toBe(false);
  });
});
