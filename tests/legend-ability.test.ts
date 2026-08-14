import { describe, it, expect } from "vitest";
import { activateLegendAbility } from "../src/game/moves";
import { runTurnStart } from "../src/game/turnFlow";
import { makeGame } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof activateLegendAbility>[0];
}

describe("activateLegendAbility", () => {
  it("rejects when the player has no legend (domain-cycling fallback games)", () => {
    const game = makeGame();
    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] });
    expect(result).toBe("INVALID_MOVE");
  });

  it("Herald of the Arcane: 1 Energy, Exhaust: play a 1 Might Recruit unit token", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-308", exhausted: false };
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: ["r1"] });

    expect(result).toBeUndefined();
    expect(game.players["0"].legend?.exhausted).toBe(true);
    expect(game.players["0"].runePool[0].exhausted).toBe(true);
    const tokenId = game.players["0"].base[0];
    expect(game.instances[tokenId].cardId).toBe("token-recruit");
  });

  it("rejects activating an already-exhausted legend", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-308", exhausted: true };
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: ["r1"] });

    expect(result).toBe("INVALID_MOVE");
  });

  it("readies the legend at Awaken", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-308", exhausted: true };
    runTurnStart(game, "0");
    expect(game.players["0"].legend?.exhausted).toBe(false);
  });
});
