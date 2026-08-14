import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { equipGear } from "../src/game/moves";
import { attachEquipment } from "../src/game/equip";
import { KeywordEngine } from "../src/keywords/registry";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof equipGear>[0];
}

describe("Card.equipCost parsing (cards/db.ts)", () => {
  it("parses a bare '<Domain> Rune' cost", () => {
    expect(getCard("sfd-161").equipCost).toEqual({ energy: 0, runeDomain: "Order" }); // B.F. Sword
  });

  it("parses a '1 Energy<Domain> Rune' cost", () => {
    expect(getCard("unl-19").equipCost).toEqual({ energy: 1, runeDomain: "Fury" }); // Blighted Battleaxe
  });

  it("leaves a non-Rune additional-cost Equip unparsed", () => {
    expect(getCard("sfd-178").equipCost).toBeUndefined(); // Blade of the Ruined King: "— Order Rune, Kill a friendly unit"
  });
});

describe("equipGear move", () => {
  it("pays the Equip cost and attaches the gear to the target", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-161", "0"); // B.F. Sword, Order Rune only
    const unit = putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Order" as const, exhausted: false }];

    const result = equipGear(ctx(game, "0"), {
      gearInstanceId: gear.instanceId,
      targetInstanceId: unit.instanceId,
      energyRuneIds: [],
      powerRuneId: "r1",
    });

    expect(result).toBeUndefined();
    expect(gear.attachedTo).toBe(unit.instanceId);
    expect(unit.equipment).toEqual([gear.instanceId]);
    expect(game.players["0"].base).not.toContain(gear.instanceId);
    expect(game.players["0"].runePool).toEqual([]);
    expect(game.players["0"].runeDeck.some((r) => r.instanceId === "r1")).toBe(true);
  });

  it("rejects paying with the wrong rune domain", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-161", "0");
    const unit = putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];

    const result = equipGear(ctx(game, "0"), {
      gearInstanceId: gear.instanceId,
      targetInstanceId: unit.instanceId,
      energyRuneIds: [],
      powerRuneId: "r1",
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects targeting a non-unit", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-161", "0");
    const otherGear = putOnBase(game, "unl-19", "0");
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Order" as const, exhausted: false }];

    const result = equipGear(ctx(game, "0"), {
      gearInstanceId: gear.instanceId,
      targetInstanceId: otherGear.instanceId,
      energyRuneIds: [],
      powerRuneId: "r1",
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("attachEquipment (game/equip.ts)", () => {
  it("re-attaching moves the gear off its previous wearer", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-161", "0");
    const first = putOnBase(game, "unit-plain-footman", "0");
    const second = putOnBase(game, "unit-plain-guard", "0");

    attachEquipment(game, getCard, gear.instanceId, first.instanceId);
    expect(first.equipment).toEqual([gear.instanceId]);

    attachEquipment(game, getCard, gear.instanceId, second.instanceId);
    expect(first.equipment).toEqual([]);
    expect(second.equipment).toEqual([gear.instanceId]);
    expect(gear.attachedTo).toBe(second.instanceId);
  });
});

describe("Weaponmaster keyword: on play, attach a friendly Equipment for free", () => {
  it("attaches the first friendly Equipment found", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-161", "0");
    const jax = putOnBase(game, "sfd-119", "0"); // Jax, Unrelenting — [Weaponmaster]

    KeywordEngine.fireOnPlay(game, getCard(jax.cardId), jax);

    expect(gear.attachedTo).toBe(jax.instanceId);
    expect(jax.equipment).toEqual([gear.instanceId]);
    expect(game.players["0"].runePool).toEqual([]); // free, no cost paid
  });

  it("does nothing when no friendly Equipment is available", () => {
    const game = makeGame();
    const jax = putOnBase(game, "sfd-119", "0");

    KeywordEngine.fireOnPlay(game, getCard(jax.cardId), jax);

    expect(jax.equipment).toEqual([]);
  });
});
