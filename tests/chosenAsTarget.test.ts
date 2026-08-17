import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { playCard, activateAbility, resolveOptionalCost } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof playCard>[0];
}

/**
 * The generic "chosen as a target" broadcast (onChosenAsTarget/onAllyChosenAsTarget/onChosenHere,
 * fired from moves.ts's resolvePlayedCard and activateAbility via SpecialCaseEngine.onChosen) that
 * unblocked 4 previously-moot cards. Direct unit tests on the SpecialCaseEngine dispatch (not the
 * full playCard/activateAbility flow) — see the individual card tests below for the real moves.
 */
describe("SpecialCaseEngine.onChosen", () => {
  it("fires onChosenAsTarget on the chosen instance's own handler", () => {
    const game = makeGame();
    const jae = putOnBase(game, "sfd-142", "1"); // Jae Medarda, controlled by player 1
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const spell = getCard("ogn-5"); // any real spell card, just needs type: "spell"

    SpecialCaseEngine.onChosen(game, getCard, "0", jae.instanceId, spell);

    // "You" = the chooser (player 0) draws, not Jae Medarda's own controller (player 1).
    expect(game.players["0"].hand).toContain("unit-plain-footman");
  });

  it("does not fire onChosenAsTarget for a non-spell source", () => {
    const game = makeGame();
    const jae = putOnBase(game, "sfd-142", "1");
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const notASpell = getCard("unit-plain-footman");

    SpecialCaseEngine.onChosen(game, getCard, "0", jae.instanceId, notASpell);

    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Hungry Wolf (ven-125): ready + buff, gated on having chosen an enemy unit this turn", () => {
  it("cannot activate before choosing an enemy unit", () => {
    const game = makeGame();
    const wolf = putOnBase(game, "ven-125", "0");
    wolf.exhausted = true;
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Order" as const, exhausted: false }];

    expect(SpecialCaseEngine.activatedAbilityCost(game, getCard(wolf.cardId), wolf)).toBeUndefined();
  });

  it("readies and buffs after choosing an enemy unit, once, this turn", () => {
    const game = makeGame();
    const wolf = putOnBase(game, "ven-125", "0");
    wolf.exhausted = true;
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Order" as const, exhausted: false }];

    SpecialCaseEngine.onChosen(game, getCard, "0", enemy.instanceId, getCard("ogn-5"));
    expect(game.players["0"].chosenEnemyUnitThisTurn).toBe(true);

    const result = activateAbility(ctx(game, "0"), {
      instanceId: wolf.instanceId,
      energyRuneIds: [],
      powerRuneId: "r1",
    });

    expect(result).toBeUndefined();
    expect(wolf.exhausted).toBe(false);
    expect(wolf.tempMightBonus).toBe(1);

    // Only once each turn — the cost function should refuse a second activation.
    expect(SpecialCaseEngine.activatedAbilityCost(game, getCard(wolf.cardId), wolf)).toBeUndefined();
  });

  it("ignores a chosen FRIENDLY unit", () => {
    const game = makeGame();
    putOnBase(game, "ven-125", "0");
    const friendly = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onChosen(game, getCard, "0", friendly.instanceId, getCard("ogn-5"));

    expect(game.players["0"].chosenEnemyUnitThisTurn).toBe(false);
  });
});

describe("Spirit Wheel (sfd-144): optional pay-1-and-exhaust to draw, on choosing a friendly unit", () => {
  it("offers the optional cost when a friendly unit is chosen", () => {
    const game = makeGame();
    const wheel = putOnBase(game, "sfd-144", "0");
    const friendly = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onChosen(game, getCard, "0", friendly.instanceId, getCard("ogn-5"));

    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "spirit-wheel",
      cost: { energy: 1 },
      payload: wheel.instanceId,
    });
  });

  it("draws and exhausts Spirit Wheel when the cost is paid", () => {
    const game = makeGame();
    const wheel = putOnBase(game, "sfd-144", "0");
    const friendly = putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].mainDeck = ["unit-plain-guard"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];

    SpecialCaseEngine.onChosen(game, getCard, "0", friendly.instanceId, getCard("ogn-5"));
    resolveOptionalCost(ctx(game, "0"), { pay: true, energyRuneIds: ["r1"] });

    expect(wheel.exhausted).toBe(true);
    expect(game.players["0"].hand).toContain("unit-plain-guard");
  });

  it("does not offer again while already exhausted", () => {
    const game = makeGame();
    const wheel = putOnBase(game, "sfd-144", "0");
    wheel.exhausted = true;
    const friendly = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onChosen(game, getCard, "0", friendly.instanceId, getCard("ogn-5"));

    expect(game.pendingOptionalCost).toBeNull();
  });
});

describe("The Dreaming Tree (ogn-292): draws once per turn per chooser, on a friendly unit chosen here", () => {
  it("draws the chooser a card the first time a friendly unit here is spell-targeted", () => {
    const game = makeGame();
    game.battlefields[0] = {
      cardId: "ogn-292",
      units: { "0": [], "1": [] },
      controller: null,
      chosenHereTriggeredThisTurn: {},
    };
    const unit = putOnBase(game, "unit-plain-footman", "0");
    unit.zone = "battlefield";
    unit.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(unit.instanceId);
    game.players["0"].mainDeck = ["unit-plain-guard"];

    SpecialCaseEngine.onChosen(game, getCard, "0", unit.instanceId, getCard("ogn-5"));

    expect(game.players["0"].hand).toContain("unit-plain-guard");
  });

  it("only draws once per turn even if triggered again", () => {
    const game = makeGame();
    game.battlefields[0] = {
      cardId: "ogn-292",
      units: { "0": [], "1": [] },
      controller: null,
      chosenHereTriggeredThisTurn: {},
    };
    const unit = putOnBase(game, "unit-plain-footman", "0");
    unit.zone = "battlefield";
    unit.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(unit.instanceId);
    game.players["0"].mainDeck = ["unit-plain-guard", "unit-plain-guard"];

    SpecialCaseEngine.onChosen(game, getCard, "0", unit.instanceId, getCard("ogn-5"));
    SpecialCaseEngine.onChosen(game, getCard, "0", unit.instanceId, getCard("ogn-5"));

    expect(game.players["0"].hand).toEqual(["unit-plain-guard"]);
  });
});
