import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { resolveCombat } from "../src/game/combat";
import { makeGame, putOnBase } from "./helpers";

function moveToBattlefield(game: ReturnType<typeof makeGame>, instanceId: string, battlefieldIndex: number) {
  const instance = game.instances[instanceId];
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  game.battlefields[battlefieldIndex].units[instance.controller].push(instanceId);
}

describe("resolveCombat", () => {
  it("attacker conquers an empty battlefield without a fight", () => {
    const game = makeGame();
    const footman = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, footman.instanceId, 0);

    resolveCombat(game, getCard, 0, "0");

    expect(game.battlefields[0].controller).toBe("0");
    expect(game.players["0"].points).toBe(1);
    expect(footman.damage).toBe(0);
  });

  it("a stronger attacker destroys a weaker defender and conquers", () => {
    const game = makeGame();
    const footman = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    const guard = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, footman.instanceId, 0);
    moveToBattlefield(game, guard.instanceId, 0);

    resolveCombat(game, getCard, 0, "0");

    expect(game.instances[guard.instanceId]).toBeUndefined();
    expect(game.players["1"].trash).toContain("unit-plain-guard");
    expect(game.instances[footman.instanceId]).toBeDefined();
    expect(footman.damage).toBe(0); // healed after combat
    expect(game.battlefields[0].controller).toBe("0");
    expect(game.players["0"].points).toBe(1);
  });

  it("mutual destruction leaves the battlefield uncaptured", () => {
    const game = makeGame();
    const footman = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    const guardA = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    const guardB = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, footman.instanceId, 0);
    moveToBattlefield(game, guardA.instanceId, 0);
    moveToBattlefield(game, guardB.instanceId, 0);

    resolveCombat(game, getCard, 0, "0");

    expect(game.instances[footman.instanceId]).toBeUndefined();
    expect(game.instances[guardA.instanceId]).toBeUndefined();
    expect(game.instances[guardB.instanceId]).toBeUndefined();
    expect(game.battlefields[0].controller).toBeNull();
    expect(game.players["0"].points).toBe(0);
  });

  it("Stun prevents the attacker from dealing damage but it can still be killed", () => {
    const game = makeGame();
    const footman = putOnBase(game, "unit-plain-footman", "0"); // Might 2, attacking
    const guard = putOnBase(game, "unit-plain-guard", "1"); // Might 1, defending
    footman.statuses.stunned = true;
    moveToBattlefield(game, footman.instanceId, 0);
    moveToBattlefield(game, guard.instanceId, 0);

    resolveCombat(game, getCard, 0, "0");

    // Guard survives untouched: the stunned attacker dealt 0 damage.
    expect(game.instances[guard.instanceId]).toBeDefined();
    expect(guard.damage).toBe(0);
    // Guard still swings back for 1, well under the footman's Might 2 toughness.
    expect(game.instances[footman.instanceId]).toBeDefined();
    expect(game.battlefields[0].controller).toBeNull();
  });

  it("grants Hunt XP to the conquering controller", () => {
    const game = makeGame();
    const hound = putOnBase(game, "unit-tracking-hound", "0");
    moveToBattlefield(game, hound.instanceId, 0);

    resolveCombat(game, getCard, 0, "0");

    expect(game.players["0"].xp).toBe(1);
  });
});
