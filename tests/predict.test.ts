import { describe, it, expect, vi } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { resolvePredict, playCard, attackBattlefield } from "../src/game/moves";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  return { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof resolvePredict>[0];
}

describe("resolvePredict (rule 436, generalized past Predict 1)", () => {
  it("recycles the chosen subset to the bottom (random order) and keeps the rest on top in the chosen order", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["a", "b", "c", "d", "e"];
    game.players["0"].pendingPredict = 3; // predicting the top 3: a, b, c

    // Recycle "a" (position 0) and "c" (position 2); keep "b" (position 1) on top.
    const result = resolvePredict(ctx(game, "0"), { recyclePositions: [0, 2], keepOrder: [1] });

    expect(result).toBeUndefined();
    expect(game.players["0"].pendingPredict).toBe(0);
    expect(game.players["0"].mainDeck.slice(0, 2)).toEqual(["b", "d"]); // kept card on top, then the untouched rest
    expect(game.players["0"].mainDeck.slice(2).sort()).toEqual(["a", "c", "e"].sort());
    // "a" and "c" ended up at the bottom (below "e", which was never part of the prediction).
    expect(game.players["0"].mainDeck.indexOf("a")).toBeGreaterThan(1);
    expect(game.players["0"].mainDeck.indexOf("c")).toBeGreaterThan(1);
  });

  it("lets the player reorder the kept cards freely (rule 436.1.b)", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["a", "b", "c"];
    game.players["0"].pendingPredict = 3;

    resolvePredict(ctx(game, "0"), { recyclePositions: [], keepOrder: [2, 0, 1] }); // c, a, b

    expect(game.players["0"].mainDeck).toEqual(["c", "a", "b"]);
  });

  it("recycling 2+ cards simultaneously randomizes their order at the bottom (rule 416.5) — not deterministically reversed or preserved", () => {
    const game = makeGame();
    // Distinct sentinel cardIds so we can tell them apart regardless of shuffle outcome.
    game.players["0"].mainDeck = ["r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7"];
    game.players["0"].pendingPredict = 8;

    resolvePredict(ctx(game, "0"), { recyclePositions: [0, 1, 2, 3, 4, 5, 6, 7], keepOrder: [] });

    // All 8 landed at the bottom (mainDeck was otherwise empty) — just confirm no loss/duplication.
    expect(game.players["0"].mainDeck.sort()).toEqual(["r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7"].sort());
  });

  it("predicts fewer than N when the Main Deck has fewer cards, without Burn Out (rule 436.4)", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["a", "b"];
    game.players["0"].trash = [];
    game.players["1"].points = 0;
    game.players["0"].pendingPredict = 5; // requested 5, only 2 exist

    const result = resolvePredict(ctx(game, "0"), { recyclePositions: [0], keepOrder: [1] });

    expect(result).toBeUndefined();
    expect(game.players["0"].mainDeck).toEqual(["b", "a"]);
    expect(game.players["1"].points).toBe(0); // no Burn Out
  });

  it("rejects a position count that doesn't match the predicted range", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["a", "b", "c"];
    game.players["0"].pendingPredict = 3;

    expect(resolvePredict(ctx(game, "0"), { recyclePositions: [0], keepOrder: [1] })).toBe(INVALID_MOVE); // missing position 2
    expect(resolvePredict(ctx(game, "0"), { recyclePositions: [0, 1, 2], keepOrder: [1] })).toBe(INVALID_MOVE); // position 1 used twice
    expect(resolvePredict(ctx(game, "0"), { recyclePositions: [5], keepOrder: [0, 1, 2] })).toBe(INVALID_MOVE); // out of range
  });

  it("rejects resolving with nothing pending", () => {
    const game = makeGame();
    expect(resolvePredict(ctx(game, "0"), { recyclePositions: [], keepOrder: [] })).toBe(INVALID_MOVE);
  });

  it("blocks playCard/attackBattlefield while a Predict decision is unresolved", () => {
    const game = makeGame();
    game.players["0"].pendingPredict = 1;
    game.players["0"].mainDeck = ["ogn-57"];
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];
    const unit = putOnBase(game, "unit-plain-footman", "0");

    expect(playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: [], powerRuneIds: [] })).toBe(INVALID_MOVE);
    expect(
      attackBattlefield(ctx(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [unit.instanceId] }),
    ).toBe(INVALID_MOVE);
  });
});

describe("Predict N wired correctly per card (rule 436.3: X defaults to 1 if omitted)", () => {
  it("Clairvoyance (ven-56) predicts 5, not 1", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-56", "0");
    game.players["0"].mainDeck = ["a", "b", "c", "d", "e", "f"];
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);
    expect(game.players["0"].pendingPredict).toBe(5);
  });

  it("Apprentice Mage (ven-47), Dramatic Visionary (unl-62), and Scryer's Bloom (unl-136) predict 2", () => {
    const game = makeGame();
    const mage = putOnBase(game, "ven-47", "0");
    SpecialCaseEngine.onBecomeEmpowered(game, getCard(mage.cardId), mage);
    expect(game.players["0"].pendingPredict).toBe(2);

    const visionary = putOnBase(game, "unl-62", "0");
    SpecialCaseEngine.onDestroy(game, getCard(visionary.cardId), visionary);
    expect(game.players["0"].pendingPredict).toBe(2);
  });

  it("Eclipse (unl-63) sets Predict 1 — previously entirely unwired", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-63", "0");
    const target = putOnBase(game, "unit-plain-footman", "1");
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(game.players["0"].pendingPredict).toBe(1);
  });

  it("Abandon (unl-131) sets Predict 1 on a normal (non-counter) play — previously entirely unwired", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-131", "0");
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);
    expect(game.players["0"].pendingPredict).toBe(1);
  });
});
