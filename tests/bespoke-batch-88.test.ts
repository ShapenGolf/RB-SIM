import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { destroyInstance } from "../src/game/combat";
import { makeGame, putOnBase } from "./helpers";

describe("Battle Mistress (sfd-203 / sfd-250)", () => {
  it("shares the same handler across both reprints", () => {
    expect(getCard("sfd-203").specialCaseId).toBe("battle-mistress");
    expect(getCard("sfd-250").specialCaseId).toBe("battle-mistress");
  });

  it("readies the legend when an enemy unit dies", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-203", exhausted: true };
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");

    destroyInstance(game, getCard, enemy.instanceId);

    expect(game.players["0"].legend?.exhausted).toBe(false);
  });

  it("doesn't ready the legend when its own controller's unit dies", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-203", exhausted: true };
    const ally = putOnBase(game, "unit-doomed-recruit", "0");

    destroyInstance(game, getCard, ally.instanceId);

    expect(game.players["0"].legend?.exhausted).toBe(true);
  });

  it("doesn't ready an unrelated legend when its own side's unit dies elsewhere", () => {
    const game = makeGame();
    game.players["1"].legend = { cardId: "sfd-203", exhausted: true };
    const ally = putOnBase(game, "unit-doomed-recruit", "1");

    destroyInstance(game, getCard, ally.instanceId);

    expect(game.players["1"].legend?.exhausted).toBe(true);
  });
});
