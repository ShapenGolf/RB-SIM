import { describe, it, expect, vi } from "vitest";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function moveCtx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  const ctx = { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof playCard>[0];
  return { ctx, setActivePlayers };
}

function moveToBattlefield(game: GameState, instanceId: string, battlefieldIndex: number) {
  const instance = game.instances[instanceId];
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  game.battlefields[battlefieldIndex].units[instance.controller].push(instanceId);
}

function fundRunePool(game: GameState, playerId: "0" | "1", energy: number, power: { domain: string; amount: number }[] = []) {
  const runes = Array.from({ length: energy }, (_, i) => ({ instanceId: `e${playerId}-${i}`, domain: "Mind" as const, exhausted: false }));
  for (const p of power) {
    for (let i = 0; i < p.amount; i += 1) {
      runes.push({ instanceId: `p${playerId}-${p.domain}-${i}`, domain: p.domain as never, exhausted: false });
    }
  }
  game.players[playerId].runePool = runes;
}
function energyIds(game: GameState, playerId: "0" | "1", n: number) {
  return game.players[playerId].runePool.filter((r) => r.domain === "Mind").slice(0, n).map((r) => r.instanceId);
}
function powerIds(game: GameState, playerId: "0" | "1", domain: string, n: number) {
  // slice(-n), not slice(0, n): fundRunePool appends power runes AFTER the energy runes, and when
  // the power domain happens to match the energy filler's "Mind" default (as it does for Riptide
  // Rex below), taking from the front would collide with energyIds' own picks.
  return game.players[playerId].runePool.filter((r) => r.domain === (domain as never)).slice(-n).map((r) => r.instanceId);
}

/**
 * Regression coverage for a bug found during the rules-audit session: card text like "Deal 3 to a
 * unit at a battlefield" (ANY battlefield) was mis-tagged with the same `atBattlefieldOnly` flag
 * used for "...a unit here" (the SAME battlefield as the effect's SOURCE) — since a hand-cast
 * spell's source instance has no battlefield of its own (battlefieldIndex is always null), this
 * made every such spell's target list empty, i.e. entirely unplayable. Fixed by splitting the flag
 * into atBattlefieldOnly ("here") vs anyBattlefieldOnly ("at a battlefield") — see
 * templatedEffects.ts's doc comments and scripts/lib/action-patterns.mjs.
 */
describe("anyBattlefieldOnly target restriction (\"...a unit at a battlefield\")", () => {
  it("Hextech Ray (ogn-9), a hand-cast spell, can target an enemy unit at a battlefield", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-9"]; // Deal 3 to a unit at a battlefield.
    fundRunePool(game, "0", 1, [{ domain: "Fury", amount: 1 }]);
    const target = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, target.instanceId, 0);

    const result = playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 1),
      powerRuneIds: powerIds(game, "0", "Fury", 1),
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    // Might 2, took 3 (lethal) damage — dead and trashed, proving the move actually resolved
    // against this target instead of being silently rejected/no-op'd.
    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["1"].trash).toContain("unit-plain-footman");
  });

  it("Hextech Ray rejects targeting a unit still in Base — only units AT a battlefield qualify", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-9"];
    fundRunePool(game, "0", 1, [{ domain: "Fury", amount: 1 }]);
    const inBase = putOnBase(game, "unit-plain-footman", "1"); // never moved to a battlefield

    const result = playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 1),
      powerRuneIds: powerIds(game, "0", "Fury", 1),
      targetInstanceId: inBase.instanceId,
    });

    expect(result).toBe("INVALID_MOVE");
  });

  it("Riptide Rex (ogn-92), played to BASE (no ambush), can still target an enemy unit at a battlefield via its onPlay trigger", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-92"]; // When you play me, deal 6 to an enemy unit at a battlefield.
    fundRunePool(game, "0", 6, [{ domain: "Mind", amount: 2 }]);
    const target = putOnBase(game, "unit-blazing-scorcher", "1");
    moveToBattlefield(game, target.instanceId, 0);

    const result = playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 6),
      powerRuneIds: powerIds(game, "0", "Mind", 2),
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    // Rex himself deployed to Base, not a battlefield — his own location has no bearing on this target.
    const rex = Object.values(game.instances).find((i) => i.cardId === "ogn-92");
    expect(rex?.zone).toBe("base");
    // Might 3, took 6 (lethal) damage — dead and trashed.
    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["1"].trash).toContain("unit-blazing-scorcher");
  });
});
