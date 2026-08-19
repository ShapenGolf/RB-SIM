import { describe, it, expect } from "vitest";
import { resolvePlayedCard } from "../src/game/moves";
import { createInstance } from "../src/game/setup";
import { runTurnStart } from "../src/game/turnFlow";
import { getCard } from "../src/cards/db";
import { makeGame, putOnBase } from "./helpers";

/**
 * Star Spring (unl-215): "The first time a player plays a non-token unit here each turn, they
 * may move another unit they control here to its base." Reuses BattlefieldSlot.
 * chosenHereTriggeredThisTurn (the same per-player, per-turn gate The Dreaming Tree already
 * established) and the onCardPlayedHere broadcast (game/moves.ts resolvePlayedCard).
 *
 * Exercises resolvePlayedCard directly (with ambushBattlefieldIndex) rather than the playCard
 * move, since a vanilla test-fixture unit has no real Ambush grant to legally deploy straight to
 * a battlefield through the move's own validation — orthogonal to what's under test here.
 */
describe("Star Spring (unl-215)", () => {
  it("moves another friendly unit here to base the first time a unit is played here this turn", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-215";
    const other = putOnBase(game, "unit-plain-footman", "0");
    game.battlefields[0].units["0"].push(other.instanceId);
    other.zone = "battlefield";
    other.battlefieldIndex = 0;

    const played = createInstance(game, "unit-plain-footman", "0");
    resolvePlayedCard(game, game.players["0"], getCard("unit-plain-footman"), played, undefined, false, 0);

    expect(other.zone).toBe("base");
    expect(game.battlefields[0].units["0"]).not.toContain(other.instanceId);
    expect(game.players["0"].base).toContain(other.instanceId);
  });

  it("does not fire a second time for the same player at the same battlefield this turn", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-215";
    const first = putOnBase(game, "unit-plain-footman", "0");
    game.battlefields[0].units["0"].push(first.instanceId);
    first.zone = "battlefield";
    first.battlefieldIndex = 0;
    const second = putOnBase(game, "unit-plain-footman", "0");
    game.battlefields[0].units["0"].push(second.instanceId);
    second.zone = "battlefield";
    second.battlefieldIndex = 0;

    const playedFirst = createInstance(game, "unit-plain-footman", "0");
    resolvePlayedCard(game, game.players["0"], getCard("unit-plain-footman"), playedFirst, undefined, false, 0);
    const playedSecond = createInstance(game, "unit-plain-footman", "0");
    resolvePlayedCard(game, game.players["0"], getCard("unit-plain-footman"), playedSecond, undefined, false, 0);

    expect(second.zone).toBe("battlefield"); // untouched by the second play this turn
  });

  it("resets at Awaken, so a new turn can trigger it again", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-215";
    game.battlefields[0].chosenHereTriggeredThisTurn = { "0": true };

    runTurnStart(game, "0");

    expect(game.battlefields[0].chosenHereTriggeredThisTurn?.["0"]).toBeUndefined();
  });
});
