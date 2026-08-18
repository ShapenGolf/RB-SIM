import { describe, it, expect, vi } from "vitest";
import { playCard, passReaction } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

/** Mocked boardgame.io move context — playCard/passReaction only read G/playerID and call events.setActivePlayers. */
function moveCtx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  const ctx = { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof playCard>[0];
  return { ctx, setActivePlayers };
}

/** Gives `playerId` enough ready Runes of `domain` to pay any of this test file's fixture spells, plus fills the required power-domain runes. */
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

describe("spell reaction window — core engine", () => {
  it("opens a window when the responder has a Reaction card, instead of resolving immediately", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"]; // Concentrate: Draw 2, no target
    game.players["1"].hand = ["ogn-64"]; // Wind Wall: has [Reaction]
    fundRunePool(game, "0", 5);

    const { ctx, setActivePlayers } = moveCtx(game, "0");
    const result = playCard(ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.pendingSpellReaction).not.toBeNull();
    expect(game.pendingSpellReaction?.casterId).toBe("0");
    expect(game.pendingSpellReaction?.cardId).toBe("unl-91");
    expect(game.players["0"].hand).toHaveLength(0); // spent, but Draw 2 hasn't resolved into a new hand yet
    expect(setActivePlayers).toHaveBeenCalledWith({ others: null });
  });

  it("resolves immediately, no window, when the responder has no Reaction card", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"];
    game.players["1"].hand = ["unit-plain-footman"]; // no [Reaction]
    game.players["0"].mainDeck = ["unit-plain-footman", "unit-plain-guard"];
    fundRunePool(game, "0", 5);

    const { ctx } = moveCtx(game, "0");
    playCard(ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    expect(game.pendingSpellReaction).toBeNull();
    expect(game.players["0"].hand.length).toBe(2); // Draw 2 already resolved
  });

  it("rejects the caster acting while their own window is open", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"];
    game.players["1"].hand = ["ogn-64"];
    fundRunePool(game, "0", 5);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });
    expect(game.pendingSpellReaction).not.toBeNull();

    game.players["0"].hand = ["unit-plain-footman"];
    const result = playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: [], powerRuneIds: [] });

    expect(result).toBe("INVALID_MOVE");
  });

  it("rejects reacting with a non-[Reaction] card", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"];
    game.players["1"].hand = ["ogn-64", "unit-plain-footman"];
    fundRunePool(game, "0", 5);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const result = playCard(moveCtx(game, "1").ctx, { handIndex: 1, energyRuneIds: [], powerRuneIds: [] });

    expect(result).toBe("INVALID_MOVE");
  });

  it("passReaction resolves the pending spell uncountered and closes the window", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"];
    game.players["0"].mainDeck = ["unit-plain-footman", "unit-plain-guard"];
    game.players["1"].hand = ["ogn-64"];
    fundRunePool(game, "0", 5);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const { ctx, setActivePlayers } = moveCtx(game, "1");
    const result = passReaction(ctx, undefined);

    expect(result).toBeUndefined();
    expect(game.pendingSpellReaction).toBeNull();
    expect(game.players["0"].hand.length).toBe(2); // Draw 2 resolved
    expect(setActivePlayers).toHaveBeenCalledWith({ currentPlayer: null });
  });

  it("rejects passReaction from the caster or when nothing is pending", () => {
    const game = makeGame();
    expect(passReaction(moveCtx(game, "0").ctx, undefined)).toBe("INVALID_MOVE");
  });
});

describe("counter cards", () => {
  it("Wind Wall counters unconditionally — the pending spell goes to trash, never resolves", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"];
    game.players["0"].mainDeck = ["unit-plain-footman"];
    game.players["1"].hand = ["ogn-64"]; // Wind Wall
    fundRunePool(game, "0", 5);
    fundRunePool(game, "1", 3, [{ domain: "Calm", amount: 2 }]);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const { ctx, setActivePlayers } = moveCtx(game, "1");
    const result = playCard(ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 3),
      powerRuneIds: powerIds(game, "1", "Calm", 2),
    });

    expect(result).toBeUndefined();
    expect(game.pendingSpellReaction).toBeNull();
    expect(game.players["0"].hand.length).toBe(0); // never drew — countered, not resolved
    expect(game.players["0"].trash).toContain("unl-91");
    expect(setActivePlayers).toHaveBeenCalledWith({ currentPlayer: null });
  });

  it("Abandon counters and returns the spell to its owner's hand instead of trash", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"];
    game.players["0"].mainDeck = ["unit-plain-footman"];
    game.players["1"].hand = ["unl-131"]; // Abandon
    fundRunePool(game, "0", 5);
    fundRunePool(game, "1", 2);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 2),
      powerRuneIds: [],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand).toContain("unl-91");
    expect(game.players["0"].trash).not.toContain("unl-91");
  });

  it("Defy rejects countering a spell over 4 Energy", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"]; // Concentrate, 5 Energy
    game.players["1"].hand = ["ogn-45"]; // Defy
    fundRunePool(game, "0", 5);
    fundRunePool(game, "1", 1, [{ domain: "Calm", amount: 1 }]);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 1),
      powerRuneIds: powerIds(game, "1", "Calm", 1),
    });

    expect(result).toBe("INVALID_MOVE");
    expect(game.pendingSpellReaction).not.toBeNull();
  });

  it("Defy legally counters a spell at exactly 4 Energy", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-229"]; // Vengeance, 4 Energy
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    game.players["1"].hand = ["ogn-45"]; // Defy
    fundRunePool(game, "0", 4, [{ domain: "Order", amount: 2 }]);
    fundRunePool(game, "1", 1, [{ domain: "Calm", amount: 1 }]);
    playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 4),
      powerRuneIds: powerIds(game, "0", "Order", 2),
      targetInstanceId: enemy.instanceId,
    });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 1),
      powerRuneIds: powerIds(game, "1", "Calm", 1),
    });

    expect(result).toBeUndefined();
    expect(game.instances[enemy.instanceId]).toBeDefined(); // Vengeance never resolved
  });

  it("Crumbling Sands only counters if the caster already played another spell this turn", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"];
    game.players["1"].hand = ["ven-39"]; // Crumbling Sands
    fundRunePool(game, "0", 5);
    fundRunePool(game, "1", 1, [{ domain: "Calm", amount: 1 }]);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 1),
      powerRuneIds: powerIds(game, "1", "Calm", 1),
    });

    expect(result).toBe("INVALID_MOVE");
  });

  it("Crumbling Sands succeeds once the caster has played another spell this turn", () => {
    const game = makeGame();
    game.players["0"].playedSpellThisTurn = true; // already cast something earlier this turn
    game.players["0"].hand = ["unl-91"];
    game.players["0"].mainDeck = ["unit-plain-footman"];
    game.players["1"].hand = ["ven-39"];
    fundRunePool(game, "0", 5);
    fundRunePool(game, "1", 1, [{ domain: "Calm", amount: 1 }]);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 1),
      powerRuneIds: powerIds(game, "1", "Calm", 1),
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand.length).toBe(0);
  });

  it("Lilting Lullaby counters and prevents its target's controller from playing spells this turn", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91", "ogn-64"];
    game.players["1"].hand = ["unl-190"]; // Lilting Lullaby
    fundRunePool(game, "0", 8); // enough for both spells
    fundRunePool(game, "1", 2, [{ domain: "Calm", amount: 2 }]);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 2),
      powerRuneIds: powerIds(game, "1", "Calm", 2),
    });

    expect(game.players["0"].cantPlaySpellsThisTurn).toBe(true);
    const blocked = playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 3).slice(0, 3),
      powerRuneIds: [],
    });
    expect(blocked).toBe("INVALID_MOVE");
  });

  it("Riposte counters and buffs its chosen unit by the countered spell's Energy cost", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-229"]; // Vengeance, 4 Energy
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    const friendly = putOnBase(game, "unit-plain-guard", "1");
    game.players["1"].hand = ["sfd-206"]; // Riposte
    fundRunePool(game, "0", 4, [{ domain: "Order", amount: 2 }]);
    fundRunePool(game, "1", 2, [{ domain: "Body", amount: 2 }]);
    playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 4),
      powerRuneIds: powerIds(game, "0", "Order", 2),
      targetInstanceId: enemy.instanceId,
    });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 2),
      powerRuneIds: powerIds(game, "1", "Body", 2),
      targetInstanceId: friendly.instanceId,
    });

    expect(result).toBeUndefined();
    expect(game.instances[enemy.instanceId]).toBeDefined(); // Vengeance countered
    expect(friendly.tempMightBonus).toBe(4);
  });

  it("Not So Fast only counters a spell targeting the reactor's own unit/gear", () => {
    const game = makeGame();
    const enemyTarget = putOnBase(game, "unit-plain-footman", "1");
    game.players["0"].hand = ["ogn-229"];
    game.players["1"].hand = ["sfd-45"]; // Not So Fast
    fundRunePool(game, "0", 4, [{ domain: "Order", amount: 2 }]);
    fundRunePool(game, "1", 2, [{ domain: "Calm", amount: 1 }]);
    playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 4),
      powerRuneIds: powerIds(game, "0", "Order", 2),
      targetInstanceId: enemyTarget.instanceId, // targets player 1's OWN unit — legal to protect
    });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 2),
      powerRuneIds: powerIds(game, "1", "Calm", 1),
    });

    expect(result).toBeUndefined();
    expect(game.instances[enemyTarget.instanceId]).toBeDefined();
  });

  it("Not So Fast rejects countering a spell that doesn't target the reactor's own unit", () => {
    const game = makeGame();
    const notMyUnit = putOnBase(game, "unit-plain-footman", "0"); // caster's OWN unit, not player 1's
    game.players["0"].hand = ["ogn-229"];
    game.players["1"].hand = ["sfd-45"];
    fundRunePool(game, "0", 4, [{ domain: "Order", amount: 2 }]);
    fundRunePool(game, "1", 2, [{ domain: "Calm", amount: 1 }]);
    playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 4),
      powerRuneIds: powerIds(game, "0", "Order", 2),
      targetInstanceId: notMyUnit.instanceId,
    });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 2),
      powerRuneIds: powerIds(game, "1", "Calm", 1),
    });

    expect(result).toBe("INVALID_MOVE");
  });

  it("Flurry of Feathers counters instead of making birds when played as a reaction", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-91"];
    game.players["0"].mainDeck = ["unit-plain-footman"];
    game.players["1"].hand = ["unl-44"]; // Flurry of Feathers
    fundRunePool(game, "0", 5);
    fundRunePool(game, "1", 4, [{ domain: "Calm", amount: 2 }]);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 4),
      powerRuneIds: powerIds(game, "1", "Calm", 2),
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand.length).toBe(0); // countered, not resolved
    expect(game.players["1"].base).toHaveLength(0); // no bird tokens made
  });

  it("Flurry of Feathers still makes birds when played normally (no pending reaction)", () => {
    const game = makeGame();
    game.players["1"].hand = ["unl-44"];
    fundRunePool(game, "1", 4, [{ domain: "Calm", amount: 2 }]);

    playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 4),
      powerRuneIds: powerIds(game, "1", "Calm", 2),
    });

    expect(game.players["1"].base).toHaveLength(4);
  });
});

describe("counter immunity", () => {
  it("Decree of Rage can't be countered", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-plain-footman", "1");
    game.players["0"].hand = ["ven-15"]; // Decree of Rage
    game.players["1"].hand = ["ogn-64"]; // Wind Wall
    fundRunePool(game, "0", 1, [{ domain: "Fury", amount: 1 }]);
    fundRunePool(game, "1", 3, [{ domain: "Calm", amount: 2 }]);
    playCard(moveCtx(game, "0").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 1),
      powerRuneIds: powerIds(game, "0", "Fury", 1),
      targetInstanceId: target.instanceId,
    });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 3),
      powerRuneIds: powerIds(game, "1", "Calm", 2),
    });

    expect(result).toBe("INVALID_MOVE");
    expect(game.pendingSpellReaction).not.toBeNull();
  });

  it("An empowered Mel, Newly Awakened protects her controller's spells from being countered", () => {
    const game = makeGame();
    const mel = putOnBase(game, "ven-69", "0");
    mel.statuses.empowered = true;
    game.players["0"].hand = ["unl-91"];
    game.players["1"].hand = ["ogn-64"];
    fundRunePool(game, "0", 5);
    fundRunePool(game, "1", 3, [{ domain: "Calm", amount: 2 }]);
    playCard(moveCtx(game, "0").ctx, { handIndex: 0, energyRuneIds: energyIds(game, "0", 5), powerRuneIds: [] });

    const result = playCard(moveCtx(game, "1").ctx, {
      handIndex: 0,
      energyRuneIds: energyIds(game, "1", 3),
      powerRuneIds: powerIds(game, "1", "Calm", 2),
    });

    expect(result).toBe("INVALID_MOVE");
  });
});
