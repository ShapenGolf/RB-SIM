import { describe, it, expect } from "vitest";
import type { Ctx } from "boardgame.io";
import { chooseBotAction } from "../src/ai/bots";
import { makeGame, putOnBase } from "./helpers";

function fakeCtx(overrides: Partial<Ctx> = {}): Ctx {
  return { currentPlayer: "0", phase: "play", turn: 4, numPlayers: 2, playOrder: ["0", "1"], playOrderPos: 0, activePlayers: null, ...overrides } as Ctx;
}

describe("ai/bots: chooseBotAction", () => {
  it("returns null when it isn't this bot's turn (no window, not currentPlayer)", () => {
    const game = makeGame();
    for (const tier of ["easy", "medium", "hard"] as const) {
      expect(chooseBotAction(tier, game, fakeCtx({ currentPlayer: "1" }), "0")).toBeNull();
    }
  });

  it("easy: falls back to endTurn on an empty board (the only legal candidate)", () => {
    const game = makeGame();
    const action = chooseBotAction("easy", game, fakeCtx(), "0");
    expect(action).toEqual({ move: "endTurn", args: {}, label: "endTurn" });
  });

  it("easy: never throws across repeated random picks on a nontrivial board", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = [{ instanceId: "r0", domain: "Fury", exhausted: false }];
    putOnBase(game, "unit-plain-footman", "0");
    for (let i = 0; i < 20; i += 1) {
      expect(() => chooseBotAction("easy", game, fakeCtx(), "0")).not.toThrow();
    }
  });

  it("medium: prefers a clearly board-improving play over passing", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-92"]; // 6E + 2 Mind: deals 6 to a chosen enemy unit at a battlefield
    game.players["0"].runePool = [
      { instanceId: "m0", domain: "Mind", exhausted: false },
      { instanceId: "m1", domain: "Mind", exhausted: false },
      ...Array.from({ length: 6 }, (_, i) => ({ instanceId: `e${i}`, domain: "Fury" as const, exhausted: false })),
    ];
    const enemy = putOnBase(game, "unit-plain-footman", "1"); // might 2 — dies to the 6 damage
    game.battlefields[0].units["1"] = [enemy.instanceId];
    enemy.zone = "battlefield";
    enemy.battlefieldIndex = 0;

    const action = chooseBotAction("medium", game, fakeCtx(), "0");
    expect(action?.move).toBe("playCard");
    expect(action?.args.handIndex).toBe(0);
    expect(action?.args.targetInstanceId).toBe(enemy.instanceId);
  });

  it("medium: passes (endTurn) when nothing else is available", () => {
    const game = makeGame();
    const action = chooseBotAction("medium", game, fakeCtx(), "0");
    expect(action?.move).toBe("endTurn");
  });

  it("hard: also finds the board-improving play (with one extra ply of lookahead) and terminates promptly", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-92", "unit-plain-footman"];
    game.players["0"].runePool = [
      { instanceId: "m0", domain: "Mind", exhausted: false },
      { instanceId: "m1", domain: "Mind", exhausted: false },
      ...Array.from({ length: 7 }, (_, i) => ({ instanceId: `e${i}`, domain: "Fury" as const, exhausted: false })),
    ];
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    game.battlefields[0].units["1"] = [enemy.instanceId];
    enemy.zone = "battlefield";
    enemy.battlefieldIndex = 0;
    // A few more units on both sides so the search has real branching to bound, not a trivial case.
    putOnBase(game, "unit-plain-footman", "0");
    putOnBase(game, "unit-plain-footman", "0");
    putOnBase(game, "unit-plain-footman", "1");

    const start = Date.now();
    const action = chooseBotAction("hard", game, fakeCtx(), "0");
    expect(Date.now() - start).toBeLessThan(5000);
    expect(action).not.toBeNull();
    expect(action?.move).not.toBe("endTurn");
  });
});
