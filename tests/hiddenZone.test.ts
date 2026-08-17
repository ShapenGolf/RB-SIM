import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { hideCard, playFromHidden } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof hideCard>[0];
}

/**
 * [Hidden]: play a card face-down into a private reserve now (game/state.ts's `hiddenZone`),
 * costing 1 recycled Rune, then play it later for free (0 Energy/Power) — see moves.ts's
 * hideCard/playFromHidden. Simplification: the reserve isn't a real Battlefield-occupying
 * face-down token (see mushroom-pouch.ts's doc comment) — just a hand-like private list, visible
 * only to its owner in the UI, same "honesty level" as the existing hand.
 */
describe("hideCard", () => {
  it("moves a [Hidden] card from hand to the hidden zone, recycling 1 Rune", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-57"]; // Block (ogn-57) has the [Hidden] keyword
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];

    const result = hideCard(ctx(game, "0"), { handIndex: 0, runeId: "r1" });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].hiddenZone).toEqual(["ogn-57"]);
    expect(game.players["0"].runePool).toEqual([]);
    expect(game.players["0"].runeDeck.map((r) => r.instanceId)).toContain("r1");
  });

  it("rejects a card without the [Hidden] keyword", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];

    const result = hideCard(ctx(game, "0"), { handIndex: 0, runeId: "r1" });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects hiding without a Rune to recycle", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-57"];
    game.players["0"].runePool = [];

    const result = hideCard(ctx(game, "0"), { handIndex: 0, runeId: "does-not-exist" });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("playFromHidden", () => {
  it("plays a card from the hidden zone for free and resolves its real onPlay effect", () => {
    const game = makeGame();
    game.players["0"].hiddenZone = ["ogn-57"];
    const weakUnit = putOnBase(game, "unit-doomed-recruit", "0");

    const result = playFromHidden(ctx(game, "0"), { hiddenIndex: 0 });

    expect(result).toBeUndefined();
    expect(game.players["0"].hiddenZone).toEqual([]);
    // Block: "Give a unit [Shield 3] and [Tank] this turn" — targets the weakest friendly unit.
    expect(weakUnit.grantedThisTurn).toContainEqual({ keyword: "shield", value: 3 });
    expect(weakUnit.grantedThisTurn).toContainEqual({ keyword: "tank" });
    // Spells go to trash after resolving, same as a normal hand play.
    expect(game.players["0"].trash).toContain("ogn-57");
  });

  it("rejects playing from an empty hidden zone", () => {
    const game = makeGame();
    game.players["0"].hiddenZone = [];

    const result = playFromHidden(ctx(game, "0"), { hiddenIndex: 0 });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Ember Monk (ogn-167): +2 Might when a card is played from Hidden", () => {
  it("buffs itself when its controller plays any card from Hidden", () => {
    const game = makeGame();
    const monk = putOnBase(game, "ogn-167", "0");
    game.players["0"].hiddenZone = ["ogn-57"];
    putOnBase(game, "unit-doomed-recruit", "0");

    playFromHidden(ctx(game, "0"), { hiddenIndex: 0 });

    expect(monk.tempMightBonus).toBe(2);
  });
});

describe("Black Market Broker (sfd-121): Gold gear token when a card is played from face down", () => {
  it("plays a Gold gear token on any Hidden play", () => {
    const game = makeGame();
    putOnBase(game, "sfd-121", "0");
    game.players["0"].hiddenZone = ["ogn-57"];
    putOnBase(game, "unit-doomed-recruit", "0");
    const baseCountBefore = game.players["0"].base.length;

    playFromHidden(ctx(game, "0"), { hiddenIndex: 0 });

    const goldGear = game.players["0"].base
      .slice(baseCountBefore)
      .map((id) => game.instances[id])
      .find((i) => i.cardId === "token-gold-gear");
    expect(goldGear).toBeDefined();
  });
});

describe("Katarina, Reckless (unl-23): ready on hide, damage on play-from-Hidden", () => {
  it("readies Katarina when her controller hides a card", () => {
    const game = makeGame();
    const kat = putOnBase(game, "unl-23", "0", { exhausted: true });
    game.players["0"].hand = ["ogn-57"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];

    hideCard(ctx(game, "0"), { handIndex: 0, runeId: "r1" });

    expect(kat.exhausted).toBe(false);
  });

  it("deals 2 to the strongest enemy unit when a card is played from Hidden", () => {
    const game = makeGame();
    putOnBase(game, "unl-23", "0");
    game.players["0"].hiddenZone = ["ogn-57"];
    putOnBase(game, "unit-doomed-recruit", "0");
    const weakEnemy = putOnBase(game, "unit-plain-footman", "1");
    const strongEnemy = putOnBase(game, "unit-blazing-scorcher", "1");

    playFromHidden(ctx(game, "0"), { hiddenIndex: 0 });

    expect(strongEnemy.damage).toBe(2);
    expect(weakEnemy.damage).toBe(0);
  });
});
