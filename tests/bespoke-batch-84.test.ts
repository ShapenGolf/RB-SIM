import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { resolveHoldTriggers } from "../src/game/combat";
import { returnInstanceToHand } from "../src/cards/special-cases/bounce-helpers";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Power Nexus (sfd-214)", () => {
  it("scores a point and spends 4 runes when holding with a full pool", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "sfd-214";
    game.battlefields[0].controller = "0";
    const player = game.players["0"];
    for (let i = 0; i < 4; i += 1) {
      player.runePool.push({ instanceId: `pool-${i}`, domain: "Mind", exhausted: false });
    }
    const deckBefore = player.runeDeck.length;

    resolveHoldTriggers(game, getCard, "0");

    expect(player.points).toBe(1);
    expect(player.runePool.length).toBe(0);
    expect(player.runeDeck.length).toBe(deckBefore + 4);
  });

  it("doesn't score if the pool has fewer than 4 runes", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "sfd-214";
    game.battlefields[0].controller = "0";
    const player = game.players["0"];
    player.runePool.push({ instanceId: "pool-0", domain: "Mind", exhausted: false });

    resolveHoldTriggers(game, getCard, "0");

    expect(player.points).toBe(0);
    expect(player.runePool.length).toBe(1);
  });
});

describe("Vaults of Helia (unl-219)", () => {
  it("rejects paying only the printed cost (1 Energy less than required)", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-219";
    game.battlefields[0].controller = "0";
    const player = game.players["0"];
    player.hand = ["unit-doomed-recruit"];
    player.runePool.push({ instanceId: "r0", domain: "Mind", exhausted: false });

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r0"],
      powerRuneIds: [],
      payAdditionalCost: false,
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("accepts the printed cost + 1 while the player holds it", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-219";
    game.battlefields[0].controller = "0";
    const player = game.players["0"];
    player.hand = ["unit-doomed-recruit"];
    player.runePool.push(
      { instanceId: "r0", domain: "Mind", exhausted: false },
      { instanceId: "r1", domain: "Mind", exhausted: false },
    );

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r0", "r1"],
      powerRuneIds: [],
      payAdditionalCost: false,
    });

    expect(result).toBeUndefined();
    expect(player.base.length).toBe(1);
  });

  it("doesn't increase cost when the player doesn't control it", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-219";
    game.battlefields[0].controller = "1";
    const player = game.players["0"];
    player.hand = ["unit-doomed-recruit"];
    player.runePool.push({ instanceId: "r0", domain: "Mind", exhausted: false });

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r0"],
      powerRuneIds: [],
      payAdditionalCost: false,
    });

    expect(result).toBeUndefined();
    expect(player.base.length).toBe(1);
  });
});

describe("Ripper's Bay (unl-214)", () => {
  it("channels an exhausted rune when a unit is bounced from its location", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-214";
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const poolBefore = game.players["0"].runePool.length;

    returnInstanceToHand(game, unit.instanceId);

    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
    expect(game.players["0"].runePool.length).toBe(poolBefore + 1);
    expect(game.players["0"].runePool[game.players["0"].runePool.length - 1].exhausted).toBe(true);
  });

  it("does nothing for a unit returned from base (not a battlefield)", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-214";
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    const poolBefore = game.players["0"].runePool.length;

    returnInstanceToHand(game, unit.instanceId);

    expect(game.players["0"].runePool.length).toBe(poolBefore);
  });
});
