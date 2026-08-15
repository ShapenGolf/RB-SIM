import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import type { FnContext } from "boardgame.io";
import { mulligan } from "../src/game/moves";
import type { GameState } from "../src/game/state";
import { makeGame } from "./helpers";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("mulligan", () => {
  it("keeps the hand size the same, replacing chosen cards with new random ones", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman", "unit-blazing-scorcher", "unit-doomed-recruit", "gear-tactical-banner"];
    game.players["0"].mainDeck = ["unit-plain-footman", "unit-blazing-scorcher", "unit-doomed-recruit"];

    const result = mulligan(ctx(game, "0"), { handIndices: [0, 2] });

    expect(result).toBeUndefined();
    const player = game.players["0"];
    expect(player.hand).toHaveLength(4);
    expect(player.mainDeck).toHaveLength(3);
    expect(player.mulliganDone).toBe(true);
    // The two untouched cards are still in hand; the two swapped ones went back into the deck pool.
    expect(player.hand).toContain("unit-blazing-scorcher");
    expect(player.hand).toContain("gear-tactical-banner");
  });

  it("allows keeping the whole hand (0 cards swapped)", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman", "unit-blazing-scorcher", "unit-doomed-recruit", "gear-tactical-banner"];
    const originalHand = [...game.players["0"].hand];
    const originalDeck = [...game.players["0"].mainDeck];

    mulligan(ctx(game, "0"), { handIndices: [] });

    const player = game.players["0"];
    expect(player.hand).toEqual(originalHand);
    expect(player.mainDeck).toEqual(originalDeck);
    expect(player.mulliganDone).toBe(true);
  });

  it("rejects more than 2 indices", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman", "unit-blazing-scorcher", "unit-doomed-recruit", "gear-tactical-banner"];

    const result = mulligan(ctx(game, "0"), { handIndices: [0, 1, 2] });

    expect(result).toBe(INVALID_MOVE);
    expect(game.players["0"].mulliganDone).toBe(false);
  });

  it("rejects a second mulligan attempt", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman", "unit-blazing-scorcher", "unit-doomed-recruit", "gear-tactical-banner"];
    mulligan(ctx(game, "0"), { handIndices: [0] });

    const result = mulligan(ctx(game, "0"), { handIndices: [1] });

    expect(result).toBe(INVALID_MOVE);
  });

  it("is independent per player", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman", "unit-blazing-scorcher", "unit-doomed-recruit", "gear-tactical-banner"];
    game.players["1"].hand = ["unit-plain-footman", "unit-blazing-scorcher", "unit-doomed-recruit", "gear-tactical-banner"];

    mulligan(ctx(game, "0"), { handIndices: [0] });

    expect(game.players["0"].mulliganDone).toBe(true);
    expect(game.players["1"].mulliganDone).toBe(false);
  });
});
