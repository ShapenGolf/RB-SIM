import { describe, it, expect, vi } from "vitest";
import { computeMight } from "../src/game/might";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { recycleRune } from "../src/game/templatedEffectEngine";
import { playCard } from "../src/game/moves";
import { runTurnStart } from "../src/game/turnFlow";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  return { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof playCard>[0];
}

/**
 * PlayerState.runesSpentThisTurn (game/state.ts), set via templatedEffectEngine.ts's
 * recycleRune — the chokepoint for every rune-recycle site. Exercised via Sivir, Mercenary, the
 * one card that reads it, plus a real playCard Power-cost payment to prove the chokepoint is
 * actually wired into the main payment path, not just the helper in isolation.
 */
describe("runesSpentThisTurn", () => {
  it("Sivir, Mercenary (sfd-143): no bonus below the 2-rune threshold", () => {
    const game = makeGame();
    const sivir = putOnBase(game, "sfd-143", "0");
    const card = getCard("sfd-143");
    const baseMight = card.might ?? 0;

    recycleRune(game.players["0"], { instanceId: "r0", domain: "Fury", exhausted: false });

    expect(computeMight(game, getCard, sivir, "none")).toBe(baseMight);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, sivir)).toBe(false);
  });

  it("Sivir, Mercenary (sfd-143): +2 Might and Ganking once 2+ runes have been spent this turn", () => {
    const game = makeGame();
    const sivir = putOnBase(game, "sfd-143", "0");
    const card = getCard("sfd-143");
    const baseMight = card.might ?? 0;

    recycleRune(game.players["0"], { instanceId: "r0", domain: "Fury", exhausted: false });
    recycleRune(game.players["0"], { instanceId: "r1", domain: "Calm", exhausted: false });

    expect(computeMight(game, getCard, sivir, "none")).toBe(baseMight + 2);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, sivir)).toBe(true);
  });

  it("a real Power-cost payment through playCard increments the counter", () => {
    const game = makeGame();
    const sivir = putOnBase(game, "sfd-143", "0");
    const card = getCard("sfd-143");
    const baseMight = card.might ?? 0;
    // Blazing Scorcher: 3 Energy, 1 Fury Power. Play it twice to reach the 2-rune threshold.
    game.players["0"].hand = ["unit-blazing-scorcher", "unit-blazing-scorcher"];
    game.players["0"].runePool = [
      { instanceId: "e0", domain: "Mind", exhausted: false },
      { instanceId: "e1", domain: "Mind", exhausted: false },
      { instanceId: "e2", domain: "Mind", exhausted: false },
      { instanceId: "p0", domain: "Fury", exhausted: false },
      { instanceId: "e3", domain: "Mind", exhausted: false },
      { instanceId: "e4", domain: "Mind", exhausted: false },
      { instanceId: "e5", domain: "Mind", exhausted: false },
      { instanceId: "p1", domain: "Fury", exhausted: false },
    ];

    let result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0", "e1", "e2"],
      powerRuneIds: ["p0"],
    });
    expect(result).toBeUndefined();
    expect(game.players["0"].runesSpentThisTurn).toBe(1);
    expect(computeMight(game, getCard, sivir, "none")).toBe(baseMight); // still below threshold

    result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e3", "e4", "e5"],
      powerRuneIds: ["p1"],
    });
    expect(result).toBeUndefined();
    expect(game.players["0"].runesSpentThisTurn).toBe(2);
    expect(computeMight(game, getCard, sivir, "none")).toBe(baseMight + 2);
  });

  it("resets to 0 at Awaken", () => {
    const game = makeGame();
    recycleRune(game.players["0"], { instanceId: "r0", domain: "Fury", exhausted: false });
    expect(game.players["0"].runesSpentThisTurn).toBe(1);

    runTurnStart(game, "0");

    expect(game.players["0"].runesSpentThisTurn).toBe(0);
  });
});
