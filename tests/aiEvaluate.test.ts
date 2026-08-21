import { describe, it, expect } from "vitest";
import { evaluate } from "../src/ai/evaluate";
import { makeGame, putOnBase } from "./helpers";

describe("ai/evaluate", () => {
  it("scores an otherwise-identical empty board as 0 for both sides", () => {
    const game = makeGame();
    expect(evaluate(game, "0")).toBe(0);
    expect(evaluate(game, "1")).toBe(0);
  });

  it("is exactly antisymmetric between the two players", () => {
    const game = makeGame();
    game.players["0"].points = 3;
    putOnBase(game, "unit-plain-footman", "0");
    game.players["1"].xp = 2;
    game.players["1"].hand = ["unit-plain-footman", "unit-plain-footman"];
    expect(evaluate(game, "0")).toBe(-evaluate(game, "1"));
  });

  it("rewards points differential heavily", () => {
    const game = makeGame();
    game.players["0"].points = 1;
    expect(evaluate(game, "0")).toBeGreaterThan(0);
    expect(evaluate(game, "1")).toBeLessThan(0);
  });

  it("rewards board Might on the scoring side", () => {
    const game = makeGame();
    putOnBase(game, "unit-plain-footman", "0"); // might 2
    expect(evaluate(game, "0")).toBeGreaterThan(0);
  });

  it("nets a unit's Might against its accumulated damage", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-plain-footman", "0"); // might 2
    unit.damage = 2; // fully worn down, contributes 0
    expect(evaluate(game, "0")).toBe(0);
  });

  it("rewards controlling more Battlefields", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    expect(evaluate(game, "0")).toBeGreaterThan(0);
    expect(evaluate(game, "1")).toBeLessThan(0);
  });

  it("a won game scores +Infinity for the winner and -Infinity for the loser", () => {
    const game = makeGame();
    game.winner = "0";
    expect(evaluate(game, "0")).toBe(Number.POSITIVE_INFINITY);
    expect(evaluate(game, "1")).toBe(Number.NEGATIVE_INFINITY);
  });
});
