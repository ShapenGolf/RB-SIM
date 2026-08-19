import { describe, it, expect, vi } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { playCard } from "../src/game/moves";
import { getCard } from "../src/cards/db";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  return { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof playCard>[0];
}

function fundRunePool(game: GameState, playerId: "0" | "1", energy: number) {
  game.players[playerId].runePool = Array.from({ length: energy }, (_, i) => ({
    instanceId: `e${playerId}-${i}`,
    domain: "Mind" as const,
    exhausted: false,
  }));
}

describe("Marai Spire (sfd-211): [Repeat] costs 1 Energy less while controlled", () => {
  it("Feral Strength's Repeat cost (2 Energy) is reduced to 1 while Marai Spire is controlled", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "sfd-211";
    game.battlefields[0].controller = "0";
    game.players["0"].hand = ["sfd-34"];
    fundRunePool(game, "0", 3); // 2 base + 1 (reduced) repeat, instead of 2+2
    const target = putOnBase(game, "unit-plain-footman", "0");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0-0", "e0-1"],
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
      payRepeatCost: true,
      repeatEnergyRuneIds: ["e0-2"],
    });

    expect(result).toBeUndefined();
    expect(target.tempMightBonus).toBe(4); // +2 applied twice
  });

  it("without controlling Marai Spire, the full 2-Energy Repeat cost is still required", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "sfd-211";
    game.battlefields[0].controller = "1"; // opponent controls it, not us
    game.players["0"].hand = ["sfd-34"];
    fundRunePool(game, "0", 3);
    const target = putOnBase(game, "unit-plain-footman", "0");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0-0", "e0-1"],
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
      payRepeatCost: true,
      repeatEnergyRuneIds: ["e0-2"], // only 1, but 2 are needed without the reduction
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Syndra, Transcendent (unl-146): repeatCost data artifact doesn't leak into play", () => {
  it("her own card data has a parsed repeatCost (from her granting text), but she's not a spell", () => {
    const card = getCard("unl-146");
    expect(card.type).toBe("champion");
    expect(card.repeatCost).toEqual({ energy: 2, runeDomain: "Chaos" });
  });

  it("playCard rejects payRepeatCost for a non-spell card even when its base cost IS fully paid", () => {
    const game = makeGame();
    const card = getCard("unl-146");
    game.players["0"].hand = ["unl-146"];
    const energyIds = Array.from({ length: card.energyCost ?? 0 }, (_, i) => `e${i}`);
    game.players["0"].runePool = [
      ...energyIds.map((instanceId) => ({ instanceId, domain: "Mind" as const, exhausted: false })),
      { instanceId: "p0", domain: "Chaos" as const, exhausted: false },
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: energyIds,
      powerRuneIds: ["p0"],
      payRepeatCost: true,
      repeatEnergyRuneIds: [],
    });

    expect(result).toBe(INVALID_MOVE);
  });
});
