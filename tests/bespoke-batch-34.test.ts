import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { runDraw } from "../src/game/turnFlow";
import { makeGame, putOnBase } from "./helpers";

describe("Endless Riches (ven-22)", () => {
  it("banishes hand and trash, then burns 7 into trash", () => {
    const game = makeGame();
    const riches = putOnBase(game, "ven-22", "0");
    game.players["0"].hand = ["unit-doomed-recruit", "token-tentacle"];
    game.players["0"].trash = ["token-shadow-clone"];
    game.players["0"].mainDeck = Array.from({ length: 10 }, () => "unit-doomed-recruit");
    const card = getCard(riches.cardId);

    SpecialCaseEngine.onPlay(game, card, riches);
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].banishment).toEqual(
      expect.arrayContaining(["unit-doomed-recruit", "token-tentacle", "token-shadow-clone"]),
    );
    expect(game.players["0"].trash.length).toBe(7);
    expect(game.players["0"].mainDeck.length).toBe(3);
  });

  it("skips the controller's Draw Phase while in play", () => {
    const game = makeGame();
    putOnBase(game, "ven-22", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];

    runDraw(game, "0");
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].mainDeck).toEqual(["unit-doomed-recruit"]);
  });

  it("doesn't affect the opponent's Draw Phase", () => {
    const game = makeGame();
    putOnBase(game, "ven-22", "0");
    game.players["1"].mainDeck = ["token-tentacle"];

    runDraw(game, "1");
    expect(game.players["1"].hand).toEqual(["token-tentacle"]);
  });
});
