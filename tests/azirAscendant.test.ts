import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { activateAbility } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof activateAbility>[0];
}

function fundCalmRune(game: GameState, playerId: "0" | "1") {
  game.players[playerId].runePool = [{ instanceId: "p0", domain: "Calm", exhausted: false }];
}

/**
 * Azir, Ascendant (sfd-50): "Calm Rune: [Action] — Choose a unit you control. Move me to its
 * location and it to my original location... Use only once per turn." A true swap via two
 * sequential single-unit moves (move-helpers.ts), captured from each unit's ORIGINAL location
 * before either one actually moves.
 */
describe("Azir, Ascendant (sfd-50)", () => {
  it("swaps positions: base <-> battlefield", () => {
    const game = makeGame();
    const azir = putOnBase(game, "sfd-50", "0");
    game.battlefields[0].units["0"].push(azir.instanceId);
    azir.zone = "battlefield";
    azir.battlefieldIndex = 0;
    const target = putOnBase(game, "unit-plain-footman", "0"); // at base
    fundCalmRune(game, "0");

    const result = activateAbility(ctx(game, "0"), {
      instanceId: azir.instanceId,
      energyRuneIds: [],
      powerRuneId: "p0",
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(azir.zone).toBe("base");
    expect(target.zone).toBe("battlefield");
    expect(target.battlefieldIndex).toBe(0);
    expect(game.battlefields[0].units["0"]).toContain(target.instanceId);
    expect(game.battlefields[0].units["0"]).not.toContain(azir.instanceId);
    expect(game.players["0"].base).toContain(azir.instanceId);
  });

  it("swaps positions: battlefield <-> different battlefield", () => {
    const game = makeGame();
    const azir = putOnBase(game, "sfd-50", "0");
    game.battlefields[0].units["0"].push(azir.instanceId);
    azir.zone = "battlefield";
    azir.battlefieldIndex = 0;
    const target = putOnBase(game, "unit-plain-footman", "0");
    game.battlefields[1].units["0"].push(target.instanceId);
    target.zone = "battlefield";
    target.battlefieldIndex = 1;
    fundCalmRune(game, "0");

    const result = activateAbility(ctx(game, "0"), {
      instanceId: azir.instanceId,
      energyRuneIds: [],
      powerRuneId: "p0",
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(azir.battlefieldIndex).toBe(1);
    expect(target.battlefieldIndex).toBe(0);
  });

  it("rejects a second use the same turn", () => {
    const game = makeGame();
    const azir = putOnBase(game, "sfd-50", "0");
    game.battlefields[0].units["0"].push(azir.instanceId);
    azir.zone = "battlefield";
    azir.battlefieldIndex = 0;
    const target = putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].runePool = [
      { instanceId: "p0", domain: "Calm", exhausted: false },
      { instanceId: "p1", domain: "Calm", exhausted: false },
    ];

    const first = activateAbility(ctx(game, "0"), {
      instanceId: azir.instanceId,
      energyRuneIds: [],
      powerRuneId: "p0",
      targetInstanceId: target.instanceId,
    });
    expect(first).toBeUndefined();

    const second = activateAbility(ctx(game, "0"), {
      instanceId: azir.instanceId,
      energyRuneIds: [],
      powerRuneId: "p1",
      targetInstanceId: target.instanceId,
    });
    expect(second).toBe(INVALID_MOVE);
  });

  it("no-ops (no swap) when targeting a unit the player doesn't control", () => {
    // activateAbility has no generic target-legitimacy check for bespoke handlers (only the UI's
    // activateNeedsTarget decides whether to prompt) — an illegal target is the onActivate
    // body's own responsibility to reject, which here means silently doing nothing rather than
    // returning INVALID_MOVE (the ability still "fires" and pays its cost).
    const game = makeGame();
    const azir = putOnBase(game, "sfd-50", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    fundCalmRune(game, "0");

    const result = activateAbility(ctx(game, "0"), {
      instanceId: azir.instanceId,
      energyRuneIds: [],
      powerRuneId: "p0",
      targetInstanceId: enemy.instanceId,
    });

    expect(result).toBeUndefined();
    expect(azir.zone).toBe("base");
    expect(enemy.zone).toBe("base");
  });
});
