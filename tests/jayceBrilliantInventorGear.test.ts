import { describe, it, expect, vi } from "vitest";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  return { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof playCard>[0];
}

/**
 * Jayce, Brilliant Inventor (ven-68) — the "first time you play a non-token gear each turn"
 * clause (the onPlay half, "when you play me", already had test coverage in
 * tests/bespoke-batch-61.test.ts). Uses ctx.instance.statuses.gearReadiedThisTurn, distinct from
 * PlayerState.playedNonTokenGearThisTurn (which is already true by the time this fires, for the
 * very gear that set it — see jayce-brilliant-inventor.ts's doc comment).
 */
describe("Jayce, Brilliant Inventor (ven-68): gear-triggered ready", () => {
  it("readies the strongest exhausted friendly unit the first time a gear is played this turn", () => {
    const game = makeGame();
    putOnBase(game, "ven-68", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const strong = putOnBase(game, "unit-blazing-scorcher", "0", { exhausted: true });
    game.players["0"].hand = ["sfd-169"];
    game.players["0"].runePool = [
      { instanceId: "e0", domain: "Mind", exhausted: false },
      { instanceId: "e1", domain: "Mind", exhausted: false },
    ];

    const result = playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["e0", "e1"], powerRuneIds: [] });

    expect(result).toBeUndefined();
    expect(strong.exhausted).toBe(false);
    expect(weak.exhausted).toBe(true);
  });

  it("does not fire a second time for a second gear played the same turn", () => {
    const game = makeGame();
    putOnBase(game, "ven-68", "0");
    const first = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const second = putOnBase(game, "unit-blazing-scorcher", "0", { exhausted: true });
    game.players["0"].hand = ["sfd-169", "sfd-169"];
    game.players["0"].runePool = [
      { instanceId: "e0", domain: "Mind", exhausted: false },
      { instanceId: "e1", domain: "Mind", exhausted: false },
      { instanceId: "e2", domain: "Mind", exhausted: false },
      { instanceId: "e3", domain: "Mind", exhausted: false },
    ];

    playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["e0", "e1"], powerRuneIds: [] });
    // The strongest (second/Blazing Scorcher) was already readied by the first gear play; the
    // second gear play this turn should ready nobody else (only weaker "first" is left exhausted).
    playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["e2", "e3"], powerRuneIds: [] });

    expect(second.exhausted).toBe(false); // readied by the FIRST gear play
    expect(first.exhausted).toBe(true); // untouched — the gate already tripped
  });
});
