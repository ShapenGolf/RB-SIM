import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { playCard } from "../src/game/moves";
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

describe("Dragon's Rage (ogn-258)", () => {
  it("moves the strongest enemy unit at a battlefield to base, then duels it with another enemy unit already there", () => {
    const game = makeGame();
    const rage = putOnBase(game, "ogn-258", "0");
    const moved = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const inBase = putOnBase(game, "unit-doomed-recruit", "1"); // Might 1
    const card = getCard(rage.cardId);

    SpecialCaseEngine.onPlay(game, card, rage);
    expect(moved.zone).toBe("base");
    expect(game.instances[inBase.instanceId]).toBeUndefined();
    expect(game.instances[moved.instanceId]).toBeDefined();
    expect(game.instances[moved.instanceId].damage).toBe(1);
  });

  it("still moves the unit even if no other enemy unit is in base to duel", () => {
    const game = makeGame();
    const rage = putOnBase(game, "ogn-258", "0");
    const moved = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(rage.cardId);

    SpecialCaseEngine.onPlay(game, card, rage);
    expect(moved.zone).toBe("base");
  });
});

describe("Decree of Discord (ven-107)", () => {
  it("greedily returns enemy Order units fitting under a 5-Might budget", () => {
    const game = makeGame();
    const decree = putOnBase(game, "ven-107", "0");
    const first = putOnBase(game, "unit-elusive-warden", "1"); // Order, Might 3
    const second = putOnBase(game, "unit-elusive-warden", "1"); // Order, Might 3 (won't fit alongside first)
    const nonOrder = putOnBase(game, "unit-doomed-recruit", "1"); // Chaos, not eligible
    const card = getCard(decree.cardId);

    SpecialCaseEngine.onPlay(game, card, decree);
    const returnedCount = [first, second].filter((i) => !game.instances[i.instanceId]).length;
    expect(returnedCount).toBe(1);
    expect(game.instances[nonOrder.instanceId]).toBeDefined();
  });
});

describe("Gust Monk (ven-101)", () => {
  it("banishes a card from trash and grants Assault 2 to the strongest ready friendly unit when the additional cost is paid", () => {
    const game = makeGame();
    game.players["0"].hand = ["ven-101"];
    game.players["0"].trash = ["unit-doomed-recruit"];
    const strongReady = putOnBase(game, "unit-blazing-scorcher", "0");
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Body", exhausted: false },
      { instanceId: "e1", domain: "Body", exhausted: false },
      { instanceId: "e2", domain: "Body", exhausted: false },
    );

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0", "e1", "e2"],
      powerRuneIds: [],
      payAdditionalCost: true,
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].trash).toEqual([]);
    expect(strongReady.grantedThisTurn.some((k) => k.keyword === "assault" && k.value === 2)).toBe(true);
  });

  it("doesn't trigger the bonus effect if the additional cost isn't paid", () => {
    const game = makeGame();
    game.players["0"].hand = ["ven-101"];
    game.players["0"].trash = ["unit-doomed-recruit"];
    const strongReady = putOnBase(game, "unit-blazing-scorcher", "0");
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Body", exhausted: false },
      { instanceId: "e1", domain: "Body", exhausted: false },
    );

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0", "e1"],
      powerRuneIds: [],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].trash).toEqual(["unit-doomed-recruit"]);
    expect(strongReady.grantedThisTurn.length).toBe(0);
  });
});
