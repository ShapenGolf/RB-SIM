import { describe, it, expect } from "vitest";
import { runDraw, drawCardsWithBurnOut, WIN_SCORE } from "../src/game/turnFlow";
import { getCard } from "../src/cards/db";
import { makeGame } from "./helpers";

describe("Burn Out (rule 431)", () => {
  it("draws normally when the Main Deck has cards — no Burn Out", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["ogn-87", "ogn-87"];
    game.players["0"].trash = [];
    runDraw(game, "0");

    expect(game.players["0"].hand).toEqual(["ogn-87"]);
    expect(game.players["0"].mainDeck).toEqual(["ogn-87"]);
    expect(game.players["1"].points).toBe(0);
  });

  it("Burns Out when the Main Deck is empty but the trash has cards: recycles trash into the deck, gives the opponent 1 point, then completes the draw", () => {
    const game = makeGame();
    game.players["0"].mainDeck = [];
    game.players["0"].trash = ["ogn-87", "unit-plain-footman", "unit-plain-guard"];
    game.players["1"].points = 0;

    runDraw(game, "0");

    expect(game.players["0"].trash).toEqual([]);
    expect(game.players["0"].mainDeck.length).toBe(2); // 3 recycled, minus the 1 just drawn
    expect(game.players["0"].hand.length).toBe(1);
    expect(game.players["1"].points).toBe(1); // the opponent, not the burning-out player
  });

  it("Burns Out repeatedly, giving 1 point each time, when both the Main Deck and trash are empty", () => {
    const game = makeGame();
    game.players["0"].mainDeck = [];
    game.players["0"].trash = [];
    game.players["1"].points = 0;

    const drawn = drawCardsWithBurnOut(game, getCard, "0", 3);

    expect(drawn).toEqual([]); // nothing to draw from an empty deck+trash
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["1"].points).toBe(3); // one Burn Out per attempted draw
  });

  it("a Burn Out point wins the game immediately (rule 431.3.b) once the recipient reaches the Victory Score with strictly more points than the opponent", () => {
    const game = makeGame();
    game.players["0"].mainDeck = [];
    game.players["0"].trash = [];
    game.players["0"].points = 3;
    game.players["1"].points = WIN_SCORE - 1;

    runDraw(game, "0");

    expect(game.players["1"].points).toBe(WIN_SCORE);
    expect(game.winner).toBe("1");
  });

  it("a Burn Out point does NOT win the game if the recipient still isn't ahead of the burning-out player", () => {
    const game = makeGame();
    game.players["0"].mainDeck = [];
    game.players["0"].trash = [];
    game.players["0"].points = WIN_SCORE + 1; // already ahead
    game.players["1"].points = WIN_SCORE - 1;

    runDraw(game, "0");

    expect(game.players["1"].points).toBe(WIN_SCORE); // reached the Victory Score...
    expect(game.winner).toBeNull(); // ...but not strictly ahead of player "0", so no win yet
  });
});
