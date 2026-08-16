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

describe("Albus Ferros (ogn-230)", () => {
  it("unbuffs every friendly buffed unit and channels 1 rune per unit unbuffed", () => {
    const game = makeGame();
    const albus = putOnBase(game, "ogn-230", "0");
    const u1 = putOnBase(game, "unit-doomed-recruit", "0");
    const u2 = putOnBase(game, "unit-blazing-scorcher", "0");
    u1.statuses.buffed = true;
    u2.statuses.buffed = true;
    const card = getCard(albus.cardId);
    const runeDeckBefore = game.players["0"].runeDeck.length;

    SpecialCaseEngine.onPlay(game, card, albus);

    expect(u1.statuses.buffed).toBe(false);
    expect(u2.statuses.buffed).toBe(false);
    expect(game.players["0"].runeDeck.length).toBe(runeDeckBefore - 2);
    expect(game.players["0"].runePool.filter((r) => r.exhausted).length).toBe(2);
  });
});

describe("Call to Glory (ogn-207)", () => {
  it("costs 0 Energy when a buffed friendly unit exists, spending its buff and giving +3 Might", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-207"];
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    unit.statuses.buffed = true;

    const result = playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: [], powerRuneIds: [] });

    expect(result).toBeUndefined();
    expect(unit.statuses.buffed).toBe(false);
    expect(unit.tempMightBonus).toBe(3);
  });

  it("costs its full printed Energy without a buffed unit", () => {
    const game = makeGame();
    const card = getCard("ogn-207");
    game.players["0"].hand = ["ogn-207"];
    game.players["0"].runePool.push(
      ...Array.from({ length: card.energyCost ?? 0 }, (_, i) => ({ instanceId: `e${i}`, domain: "Mind" as const, exhausted: false })),
    );

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
    });

    expect(result).toBeUndefined();
  });
});
