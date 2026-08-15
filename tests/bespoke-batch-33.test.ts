import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { activateAbility } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
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

describe("Safety Inspector (unl-164)", () => {
  it("kills each player's weakest unit when the additional cost is not paid", () => {
    const game = makeGame();
    const inspector = putOnBase(game, "unl-164", "0");
    const ownWeak = putOnBase(game, "unit-doomed-recruit", "0");
    const enemyWeak = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(inspector.cardId);

    SpecialCaseEngine.onPlay(game, card, inspector);
    expect(game.instances[ownWeak.instanceId]).toBeUndefined();
    expect(game.instances[enemyWeak.instanceId]).toBeUndefined();
  });

  it("spares the controller's unit (but not the opponent's) when the additional cost is paid", () => {
    const game = makeGame();
    const inspector = putOnBase(game, "unl-164", "0");
    inspector.statuses.paidAdditionalCostThisTurn = true;
    const ownWeak = putOnBase(game, "unit-doomed-recruit", "0");
    const enemyWeak = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(inspector.cardId);

    SpecialCaseEngine.onPlay(game, card, inspector);
    expect(game.instances[ownWeak.instanceId]).toBeDefined();
    expect(game.instances[enemyWeak.instanceId]).toBeUndefined();
  });
});

describe("Sky Cruiser (ven-60)", () => {
  it("discards a card and deals 4 to the strongest enemy unit at a battlefield it can kill", () => {
    const game = makeGame();
    const cruiser = putOnBase(game, "ven-60", "0", { exhausted: false });
    game.players["0"].hand = ["token-tentacle"];
    game.players["0"].runePool.push({ instanceId: "e0", domain: "Body", exhausted: false });
    const weak = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const strong = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);

    const result = activateAbility(ctx(game, "0"), {
      instanceId: cruiser.instanceId,
      energyRuneIds: ["e0"],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand).toEqual([]);
    expect(cruiser.exhausted).toBe(true);
    expect(game.instances[strong.instanceId]).toBeUndefined();
    expect(game.instances[weak.instanceId]).toBeDefined();
  });
});
