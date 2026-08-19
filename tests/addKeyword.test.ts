import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { activateAbility, activateLegendAbility } from "../src/game/moves";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof activateAbility>[0];
}

/**
 * [Add] (rule 429) is "put resources into a player's Rune Pool" — the SAME rune pool
 * energyRuneIds/powerRuneIds already spend from, not a separate resource system. Several bespoke
 * cards were previously flagged "moot — no infra for [Add]", which was stale: the generic
 * `gainRune` templated action already modeled this. These cards just weren't wired to it.
 */
describe("[Add] wired to real cards (rule 429)", () => {
  it("Dragonsoul Sage (unl-93): Exhaust: Add 1 Energy — a unit's activated ability", () => {
    const game = makeGame();
    const sage = putOnBase(game, "unl-93", "0");

    const result = activateAbility(ctx(game, "0"), { instanceId: sage.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(sage.exhausted).toBe(true);
    expect(game.players["0"].runePool).toHaveLength(1);
    expect(game.players["0"].runePool[0].domain).toBe("Colorless");
    expect(game.players["0"].runePool[0].exhausted).toBe(false);
  });

  it("Energy Conduit (ogn-98), a gear: same Exhaust: Add 1 Energy shape", () => {
    const game = makeGame();
    const gear = putOnBase(game, "ogn-98", "0");

    activateAbility(ctx(game, "0"), { instanceId: gear.instanceId, energyRuneIds: [] });

    expect(game.players["0"].runePool).toHaveLength(1);
    expect(game.players["0"].runePool[0].domain).toBe("Colorless");
  });

  it("Lux, Crownguard (ogs-14): Add 2 Energy in one activation", () => {
    const game = makeGame();
    const lux = putOnBase(game, "ogs-14", "0");

    activateAbility(ctx(game, "0"), { instanceId: lux.instanceId, energyRuneIds: [] });

    expect(game.players["0"].runePool).toHaveLength(2);
    expect(game.players["0"].runePool.every((r) => r.domain === "Colorless")).toBe(true);
  });

  it("Daughter of the Void (ogn-247), a Legend: Add 1 Power of its first domain (Fury)", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-247", exhausted: false };

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.players["0"].legend?.exhausted).toBe(true);
    expect(game.players["0"].runePool).toHaveLength(1);
    expect(game.players["0"].runePool[0].domain).toBe("Fury");
  });

  it("Fire Below the Mountain (sfd-189), a Legend: Add 1 Power of its first domain (Calm)", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-189", exhausted: false };

    activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] });

    expect(game.players["0"].runePool).toHaveLength(1);
    expect(game.players["0"].runePool[0].domain).toBe("Calm");
  });

  it("Scorn of the Moon (unl-197), a Legend: Add 1 Energy", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-197", exhausted: false };

    activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] });

    expect(game.players["0"].runePool).toHaveLength(1);
    expect(game.players["0"].runePool[0].domain).toBe("Colorless");
  });

  it("Hand of Noxus (ogn-253), a Legend: [Legion]-gated — no cost/ability at all until another card has been played this turn", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-253", exhausted: false };
    const card = getCard("ogn-253");
    const instance = { controller: "0" as const, exhausted: false } as never;

    // Before any card played this turn: the cost function returns undefined — the ability doesn't exist yet.
    expect(SpecialCaseEngine.activatedAbilityCost(game, card, instance)).toBeUndefined();
    expect(activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] })).toBe(INVALID_MOVE);

    // Once a card has been played this turn, the ability is available.
    game.players["0"].playedMainDeckCardThisTurn = true;
    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.players["0"].runePool).toHaveLength(1);
    expect(game.players["0"].runePool[0].domain).toBe("Colorless");
  });
});
