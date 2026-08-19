import { describe, it, expect, vi } from "vitest";
import { attackBattlefield, playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function moveCtx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  const ctx = { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof attackBattlefield>[0];
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
  return game.players[playerId].runePool.filter((r) => r.domain === (domain as never)).slice(0, n).map((r) => r.instanceId);
}

describe("[Action] cards during a combat reaction window (rule 806.1.b)", () => {
  it("opens a combat reaction window for a defender who only has an [Action] spell — not just [Reaction]", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const defender = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["ogn-9"]; // Hextech Ray — [Action], no [Reaction]

    const { ctx, setActivePlayers } = moveCtx(game, "0");
    const result = attackBattlefield(ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(result).toBeUndefined();
    expect(game.pendingCombatReaction).toEqual({ attacker: "0", battlefieldIndex: 0 });
    expect(setActivePlayers).toHaveBeenCalledWith({ others: null });
  });

  it("lets the defender play an [Action] spell into the combat window, resolving it before combat math runs", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const defender = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["ogn-224"]; // Salvage: [Action] You may kill a gear. Draw 1.
    fundRunePool(game, "1", 2, [{ domain: "Order", amount: 1 }]);
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });
    expect(game.pendingCombatReaction).not.toBeNull();

    const { ctx, setActivePlayers } = moveCtx(game, "1");
    const result = playCard(ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 2),
      powerRuneIds: powerIds(game, "1", "Order", 1),
    });

    expect(result).toBeUndefined();
    expect(game.pendingCombatReaction).toBeNull();
    expect(game.players["1"].hand.length).toBe(1); // drew 1 from Salvage's effect, resolved before combat
    // Combat then resolved normally afterward — Might-2 attacker beats Might-1 defender.
    expect(game.instances[defender.instanceId]).toBeUndefined();
    expect(setActivePlayers).toHaveBeenCalledWith({ currentPlayer: null });
  });

  it("rejects an [Action]-only (non-[Reaction]) spell reacting to a pending SPELL — Action only grants Showdown timing, not general instant-speed", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"]; // Concentrate: Draw 2, no target — opens a spell reaction window
    game.players["1"].hand = ["ogn-64", "ogn-9"]; // Wind Wall [Reaction] (opens the window) + Hextech Ray [Action]-only
    fundRunePool(game, "0", 5);
    fundRunePool(game, "1", 4, [{ domain: "Fury", amount: 1 }]);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });
    expect(game.pendingSpellReaction).not.toBeNull();

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 1, // Hextech Ray
      energyRuneIds: energyIds(game, "1", 1),
      powerRuneIds: powerIds(game, "1", "Fury", 1),
      targetInstanceId: undefined,
    });

    expect(result).toBe("INVALID_MOVE");
    expect(game.pendingSpellReaction).not.toBeNull();
  });
});
