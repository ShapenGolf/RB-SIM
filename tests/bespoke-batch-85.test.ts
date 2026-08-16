import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { resolveCombat } from "../src/game/combat";
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

describe("Orn's Forge (sfd-213)", () => {
  it("reduces the cost of the first friendly non-token gear played each turn while controlled", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "sfd-213";
    game.battlefields[0].controller = "0";
    const player = game.players["0"];
    player.hand = ["gear-tactical-banner"]; // gear, printed 2 Energy, no power cost
    player.runePool.push({ instanceId: "r0", domain: "Mind", exhausted: false });

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r0"], // 2 - 1 (Orn's Forge discount) = 1
      powerRuneIds: [],
      payAdditionalCost: false,
    });

    expect(result).toBeUndefined();
    expect(player.playedNonTokenGearThisTurn).toBe(true);
  });

  it("doesn't reduce cost for a second gear played the same turn", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "sfd-213";
    game.battlefields[0].controller = "0";
    const player = game.players["0"];
    player.playedNonTokenGearThisTurn = true;
    player.hand = ["gear-tactical-banner"];
    player.runePool.push({ instanceId: "r0", domain: "Mind", exhausted: false });

    const underpaid = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r0"], // only 1 — full printed cost is 2, no discount applies
      powerRuneIds: [],
      payAdditionalCost: false,
    });
    expect(underpaid).toBe(INVALID_MOVE);
  });

  it("doesn't reduce cost when the player doesn't control the battlefield", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "sfd-213";
    game.battlefields[0].controller = "1";
    const player = game.players["0"];
    player.hand = ["gear-tactical-banner"];
    player.runePool.push({ instanceId: "r0", domain: "Mind", exhausted: false });

    const underpaid = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r0"],
      powerRuneIds: [],
      payAdditionalCost: false,
    });
    expect(underpaid).toBe(INVALID_MOVE);
  });
});

describe("Petricite Monument (sfd-104)", () => {
  it("registers with no observable effect beyond the generic Temporary sweep", () => {
    const card = getCard("sfd-104");
    expect(card.specialCaseId).toBe("petricite-monument");
  });
});

describe("Dune Surfer (ven-4)", () => {
  it("lets the attacker ignore an enemy Tank's damage priority at Dune Surfer's location", () => {
    const game = makeGame();
    const dune = putOnBattlefield(game, "ven-4", "0", 0); // attacker side, Might 3
    // nonTank pushed first (array index 0), tank pushed second (index 1) — without Tank-priority,
    // insertion order (nonTank first) determines who's hit first instead.
    const nonTank = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const tank = putOnBattlefield(game, "ven-118", "1", 0); // Might 6, Tank

    resolveCombat(game, getCard, 0, "0");

    // Total attacker damage = Dune Surfer's Might 3. Tank ignored -> nonTank (idx0) hit first for
    // 1 (dies), remaining 2 goes to the Tank (survives, Might 6).
    expect(game.instances[nonTank.instanceId]).toBeUndefined();
    expect(game.instances[tank.instanceId]).toBeDefined();
    void dune;
  });

  it("respects normal Tank-first ordering without Dune Surfer present", () => {
    const game = makeGame();
    const attacker = putOnBattlefield(game, "unit-blazing-scorcher", "0", 0); // Might 3
    const nonTank = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const tank = putOnBattlefield(game, "ven-118", "1", 0); // Might 6, Tank

    resolveCombat(game, getCard, 0, "0");

    // Tank-first: all 3 damage goes to the Tank (toughness 6), nonTank untouched and survives.
    expect(game.instances[nonTank.instanceId]).toBeDefined();
    expect(game.instances[tank.instanceId]).toBeDefined();
    void attacker;
  });

  it("doesn't affect ordering at a different battlefield", () => {
    const game = makeGame();
    putOnBattlefield(game, "ven-4", "0", 1); // Dune Surfer elsewhere
    putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    const nonTank = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const tank = putOnBattlefield(game, "ven-118", "1", 0);

    resolveCombat(game, getCard, 0, "0");

    expect(game.instances[nonTank.instanceId]).toBeDefined();
    expect(game.instances[tank.instanceId]).toBeDefined();
  });
});
