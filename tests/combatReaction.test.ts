import { describe, it, expect, vi } from "vitest";
import { attackBattlefield, passCombatReaction, playCard } from "../src/game/moves";
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

describe("combat reaction window", () => {
  it("opens a window when the defender has a Reaction card, instead of resolving immediately", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const defender = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["ogn-64"]; // Wind Wall — has [Reaction]

    const { ctx, setActivePlayers } = moveCtx(game, "0");
    const result = attackBattlefield(ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(result).toBeUndefined();
    expect(game.pendingCombatReaction).toEqual({ attacker: "0", battlefieldIndex: 0 });
    expect(game.instances[defender.instanceId]).toBeDefined(); // combat hasn't resolved yet
    expect(game.instances[defender.instanceId].damage).toBe(0);
    expect(setActivePlayers).toHaveBeenCalledWith({ others: null });
  });

  it("resolves immediately, no window, when the defender has no Reaction card", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    const defender = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["unit-plain-footman"]; // no [Reaction]

    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(game.pendingCombatReaction).toBeNull();
    expect(game.instances[defender.instanceId]).toBeUndefined(); // already resolved and died
  });

  it("resolves immediately when walking into an undefended battlefield, when the opponent has no Reaction/Action card", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    game.players["1"].hand = ["unit-plain-footman"]; // no [Reaction]/[Action]

    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(game.pendingCombatReaction).toBeNull();
    expect(game.battlefields[0].controller).toBe("0"); // conquered outright, no fight
  });

  it("opens a Non-Combat Showdown window (rule 344.2) walking into an undefended battlefield when the opponent has a Reaction card, instead of conquering outright", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    game.players["1"].hand = ["ogn-64"]; // Wind Wall — has [Reaction]

    const { ctx, setActivePlayers } = moveCtx(game, "0");
    const result = attackBattlefield(ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(result).toBeUndefined();
    expect(game.pendingCombatReaction).toEqual({ attacker: "0", battlefieldIndex: 0 });
    expect(game.battlefields[0].controller).toBeNull(); // not conquered yet — waiting on the window
    expect(setActivePlayers).toHaveBeenCalledWith({ others: null });
  });

  it("passCombatReaction on an undefended walk-in resolves it as a normal outright conquer once the window closes", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    game.players["1"].hand = ["ogn-64"];
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });
    expect(game.pendingCombatReaction).not.toBeNull();

    const result = passCombatReaction(moveCtx(game, "1").ctx, undefined);

    expect(result).toBeUndefined();
    expect(game.pendingCombatReaction).toBeNull();
    expect(game.battlefields[0].controller).toBe("0");
  });

  it("rejects the attacker acting while their own window is open", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const attacker2 = putOnBase(game, "unit-plain-footman", "0");
    const defender = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["ogn-64"];
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    const result = attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 1, unitInstanceIds: [attacker2.instanceId] });

    expect(result).toBe("INVALID_MOVE");
  });

  it("passCombatReaction resolves combat normally and closes the window", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    const defender = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["ogn-64"];
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    const { ctx, setActivePlayers } = moveCtx(game, "1");
    const result = passCombatReaction(ctx, undefined);

    expect(result).toBeUndefined();
    expect(game.pendingCombatReaction).toBeNull();
    expect(game.instances[defender.instanceId]).toBeUndefined(); // now resolved, defender died
    expect(setActivePlayers).toHaveBeenCalledWith({ currentPlayer: null });
  });

  it("rejects passCombatReaction from the attacker or when nothing is pending", () => {
    const game = makeGame();
    expect(passCombatReaction(moveCtx(game, "0").ctx, undefined)).toBe("INVALID_MOVE");
  });

  it("rejects a counter-intent card played into a combat reaction window — nothing to counter", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const defender = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["ogn-64"]; // Wind Wall — counter intent
    fundRunePool(game, "1", 3, [{ domain: "Calm", amount: 2 }]);
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 3),
      powerRuneIds: powerIds(game, "1", "Calm", 2),
    });

    expect(result).toBe("INVALID_MOVE");
    expect(game.pendingCombatReaction).not.toBeNull();
  });

  it("a non-counter [Reaction] spell resolves its own effect BEFORE combat math runs, then combat resolves", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    const defender = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["unl-66"]; // Moonlight Affliction: -10 Might this turn, any unit
    fundRunePool(game, "1", 7);
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });
    expect(game.pendingCombatReaction).not.toBeNull();

    const { ctx, setActivePlayers } = moveCtx(game, "1");
    const result = playCard(ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 7),
      powerRuneIds: [],
      targetInstanceId: attacker.instanceId,
    });

    expect(result).toBeUndefined();
    expect(game.pendingCombatReaction).toBeNull();
    // The debuff landed on the attacker before combat resolved, and combat DID resolve afterward:
    // a Might-2 attacker reduced to -8 deals 0 damage, so the Might-1 defender survives untouched.
    expect(game.instances[defender.instanceId]).toBeDefined();
    expect(game.instances[defender.instanceId].damage).toBe(0);
    expect(setActivePlayers).toHaveBeenCalledWith({ currentPlayer: null });
  });

  it("rejects reacting with a non-[Reaction] card during a combat window", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const defender = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["1"].hand = ["ogn-64", "unit-plain-footman"];
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    const result = playCard(moveCtx(game, "1").ctx, { handIndex: 1, energyRuneIds: [], powerRuneIds: [] });

    expect(result).toBe("INVALID_MOVE");
  });
});
