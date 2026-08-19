import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { destroyInstance } from "../src/game/combat";
import { moveInstanceToBase, moveInstanceToBattlefield } from "../src/cards/special-cases/move-helpers";
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

describe("Forgotten Library (unl-211)", () => {
  it("sets pendingPredict when the controlling player plays a 4+ Energy spell", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-211";
    game.battlefields[0].controller = "0";
    const player = game.players["0"];
    player.maxEnergySpentOnSpellThisTurn = 4;

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("unit-doomed-recruit"), 1);
    expect(player.pendingPredict).toBe(0);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("spell-dangerous-duo"), 1);
    expect(player.pendingPredict).toBe(1);
  });

  it("does nothing if the player doesn't control the battlefield", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-211";
    game.battlefields[0].controller = "1";
    const player = game.players["0"];
    player.maxEnergySpentOnSpellThisTurn = 4;

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("spell-dangerous-duo"), 1);
    expect(player.pendingPredict).toBe(0);
  });

  it("does nothing if under the 4 Energy threshold", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-211";
    game.battlefields[0].controller = "0";
    const player = game.players["0"];
    player.maxEnergySpentOnSpellThisTurn = 2;

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("spell-dangerous-duo"), 1);
    expect(player.pendingPredict).toBe(0);
  });
});

describe("Stealthy Pursuer (ogn-177)", () => {
  it("moves itself along with a friendly unit that moves to another battlefield", () => {
    const game = makeGame();
    const pursuer = putOnBattlefield(game, "ogn-177", "0", 0);
    const mover = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    moveInstanceToBattlefield(game, mover.instanceId, 1);

    expect(mover.battlefieldIndex).toBe(1);
    expect(pursuer.battlefieldIndex).toBe(1);
    expect(game.battlefields[0].units["0"]).not.toContain(pursuer.instanceId);
    expect(game.battlefields[1].units["0"]).toContain(pursuer.instanceId);
  });

  it("moves itself to base along with a friendly unit that moves to base", () => {
    const game = makeGame();
    const pursuer = putOnBattlefield(game, "ogn-177", "0", 0);
    const mover = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    moveInstanceToBase(game, getCard, mover.instanceId);

    expect(mover.zone).toBe("base");
    expect(pursuer.zone).toBe("base");
  });

  it("doesn't move for an enemy unit's move", () => {
    const game = makeGame();
    const pursuer = putOnBattlefield(game, "ogn-177", "0", 0);
    const enemyMover = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);

    moveInstanceToBattlefield(game, enemyMover.instanceId, 1);

    expect(pursuer.battlefieldIndex).toBe(0);
  });
});

describe("Nasus, Guardian of Knowledge (ven-63 / ven-178)", () => {
  it("shares the same handler across both reprints", () => {
    expect(getCard("ven-63").specialCaseId).toBe("nasus-guardian-of-knowledge");
    expect(getCard("ven-178").specialCaseId).toBe("nasus-guardian-of-knowledge");
  });

  it("channels an exhausted rune when an enemy unit dies at its location", () => {
    const game = makeGame();
    const nasus = putOnBattlefield(game, "ven-63", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const poolBefore = game.players["0"].runePool.length;

    destroyInstance(game, getCard, enemy.instanceId);

    expect(game.players["0"].runePool.length).toBe(poolBefore + 1);
    expect(game.players["0"].runePool[game.players["0"].runePool.length - 1].exhausted).toBe(true);
    expect(nasus.statuses.channeledFromEnemyDeathThisTurn).toBe(true);
  });

  it("only channels once per turn", () => {
    const game = makeGame();
    putOnBattlefield(game, "ven-63", "0", 0);
    const enemy1 = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const enemy2 = putOnBattlefield(game, "unit-farsighted-scout", "1", 0);

    destroyInstance(game, getCard, enemy1.instanceId);
    const poolAfterFirst = game.players["0"].runePool.length;

    destroyInstance(game, getCard, enemy2.instanceId);

    expect(game.players["0"].runePool.length).toBe(poolAfterFirst);
  });

  it("doesn't channel for a death at a different battlefield", () => {
    const game = makeGame();
    putOnBattlefield(game, "ven-63", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 1);
    const poolBefore = game.players["0"].runePool.length;

    destroyInstance(game, getCard, enemy.instanceId);

    expect(game.players["0"].runePool.length).toBe(poolBefore);
  });

  it("doesn't channel for a friendly unit's death", () => {
    const game = makeGame();
    putOnBattlefield(game, "ven-63", "0", 0);
    const ally = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const poolBefore = game.players["0"].runePool.length;

    destroyInstance(game, getCard, ally.instanceId);

    expect(game.players["0"].runePool.length).toBe(poolBefore);
  });
});
