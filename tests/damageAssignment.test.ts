import { describe, it, expect, vi } from "vitest";
import { attackBattlefield, submitDamageAssignment } from "../src/game/moves";
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

describe("damage assignment as a player choice (rule 460.2.c)", () => {
  it("resolves immediately with no window when neither side has a real choice (1v1)", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    const defender = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, defender.instanceId, 0);

    const { ctx, setActivePlayers } = moveCtx(game, "0");
    attackBattlefield(ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(game.pendingDamageAssignment).toBeNull();
    expect(game.instances[defender.instanceId]).toBeUndefined(); // resolved and died already
    expect(setActivePlayers).not.toHaveBeenCalled();
  });

  it("opens a window when the attacker has a real choice — 2 defenders sharing the same rank — pre-filling the defender's forced (no-choice) order", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0"); // Might 2, attacking alone
    const guard = putOnBase(game, "unit-plain-guard", "1"); // Might 1, toughness 1
    const footman2 = putOnBase(game, "unit-plain-footman", "1"); // Might 2, toughness 2
    moveToBattlefield(game, guard.instanceId, 0);
    moveToBattlefield(game, footman2.instanceId, 0);

    const { ctx, setActivePlayers } = moveCtx(game, "0");
    const result = attackBattlefield(ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(result).toBeUndefined();
    expect(game.pendingDamageAssignment).toEqual({
      battlefieldIndex: 0,
      attacker: "0",
      defender: "1",
      attackerOrder: null, // real choice: 2 defenders share rank 1 (no tank/backline)
      defenderOrder: [attacker.instanceId], // only 1 attacking unit — nothing to choose, pre-filled
    });
    expect(setActivePlayers).toHaveBeenCalledWith({ all: null });
    // Nothing has resolved yet — both units still alive, undamaged.
    expect(game.instances[guard.instanceId].damage).toBe(0);
    expect(game.instances[footman2.instanceId].damage).toBe(0);
  });

  it("lets the attacker's chosen order decide who takes the killing blow — same total damage, different outcome by order", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0"); // Might 2 total damage
    const guard = putOnBase(game, "unit-plain-guard", "1"); // toughness 1
    const footman2 = putOnBase(game, "unit-plain-footman", "1"); // toughness 2
    moveToBattlefield(game, guard.instanceId, 0);
    moveToBattlefield(game, footman2.instanceId, 0);
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    // Assign all 2 damage into the tougher footman first — exactly lethal, nothing spills to the guard.
    const result = submitDamageAssignment(moveCtx(game, "0").ctx, {
      order: [footman2.instanceId, guard.instanceId],
    });

    expect(result).toBeUndefined();
    expect(game.pendingDamageAssignment).toBeNull();
    expect(game.instances[footman2.instanceId]).toBeUndefined(); // died
    expect(game.instances[guard.instanceId]).toBeDefined();
    expect(game.instances[guard.instanceId].damage).toBe(0); // untouched
  });

  it("rejects a submitted order that isn't a valid permutation of the eligible targets", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const guard = putOnBase(game, "unit-plain-guard", "1");
    const footman2 = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, guard.instanceId, 0);
    moveToBattlefield(game, footman2.instanceId, 0);
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(submitDamageAssignment(moveCtx(game, "0").ctx, { order: [guard.instanceId] })).toBe("INVALID_MOVE"); // wrong length
    expect(
      submitDamageAssignment(moveCtx(game, "0").ctx, { order: [guard.instanceId, guard.instanceId] }),
    ).toBe("INVALID_MOVE"); // duplicate
    expect(
      submitDamageAssignment(moveCtx(game, "0").ctx, { order: [guard.instanceId, attacker.instanceId] }),
    ).toBe("INVALID_MOVE"); // not an eligible target
    expect(game.pendingDamageAssignment).not.toBeNull();
  });

  it("rejects the wrong player, a second submission from the same side, and submitting with nothing pending", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const guard = putOnBase(game, "unit-plain-guard", "1");
    const footman2 = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, guard.instanceId, 0);
    moveToBattlefield(game, footman2.instanceId, 0);
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    const order = [footman2.instanceId, guard.instanceId];
    // "1" (defender) has no choice here (only 1 attacking unit) — its slot is pre-filled, so a
    // manual submission from "1" has nothing left to fill in and is rejected too.
    expect(submitDamageAssignment(moveCtx(game, "1").ctx, { order })).toBe("INVALID_MOVE");

    expect(submitDamageAssignment(moveCtx(game, "0").ctx, { order })).toBeUndefined();
    expect(game.pendingDamageAssignment).toBeNull();

    expect(submitDamageAssignment(moveCtx(game, "0").ctx, { order })).toBe("INVALID_MOVE"); // nothing pending anymore
  });

  it("rejects an order that violates Tank-first rank-monotonicity (rule 815/460.2.c)", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const tank1 = putOnBase(game, "ogn-87", "1"); // Lecturing Yordle — [Tank], Might 2
    const tank2 = putOnBase(game, "ogn-87", "1");
    const guard = putOnBase(game, "unit-plain-guard", "1"); // no Tank, rank 1
    moveToBattlefield(game, tank1.instanceId, 0);
    moveToBattlefield(game, tank2.instanceId, 0);
    moveToBattlefield(game, guard.instanceId, 0);
    attackBattlefield(moveCtx(game, "0").ctx, { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(game.pendingDamageAssignment?.attackerOrder).toBeNull(); // 2 Tanks share rank 0 — real choice

    // The non-Tank guard placed ahead of a Tank is illegal.
    expect(
      submitDamageAssignment(moveCtx(game, "0").ctx, {
        order: [guard.instanceId, tank1.instanceId, tank2.instanceId],
      }),
    ).toBe("INVALID_MOVE");
    expect(
      submitDamageAssignment(moveCtx(game, "0").ctx, {
        order: [tank1.instanceId, guard.instanceId, tank2.instanceId],
      }),
    ).toBe("INVALID_MOVE");

    // Free choice within the Tank rank is fine, as long as the guard comes last.
    const result = submitDamageAssignment(moveCtx(game, "0").ctx, {
      order: [tank2.instanceId, tank1.instanceId, guard.instanceId],
    });
    expect(result).toBeUndefined();
    expect(game.pendingDamageAssignment).toBeNull();
  });
});
