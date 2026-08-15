import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { createInstance } from "../src/game/setup";
import { resolvePlayedCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";

describe("Glasc Mixologist (sfd-165)", () => {
  it("plays a <=3 Energy unit from trash ignoring cost on death", () => {
    const game = makeGame();
    const mixologist = putOnBase(game, "sfd-165", "0");
    game.players["0"].trash = ["unit-doomed-recruit"];
    const card = getCard(mixologist.cardId);

    SpecialCaseEngine.onDestroy(game, card, mixologist);
    expect(game.players["0"].trash).not.toContain("unit-doomed-recruit");
    const played = Object.values(game.instances).find((i) => i.cardId === "unit-doomed-recruit");
    expect(played).toBeDefined();
  });

  it("does nothing if the trash has no eligible unit", () => {
    const game = makeGame();
    const mixologist = putOnBase(game, "sfd-165", "0");
    game.players["0"].trash = [];
    const card = getCard(mixologist.cardId);
    expect(() => SpecialCaseEngine.onDestroy(game, card, mixologist)).not.toThrow();
  });
});

describe("King's Edict (ogn-237)", () => {
  it("kills the opponent's weakest unit", () => {
    const game = makeGame();
    const weak = putOnBase(game, "unit-doomed-recruit", "1");
    const strong = putOnBase(game, "unit-blazing-scorcher", "1");
    const edict = putOnBase(game, "ogn-237", "0");
    const card = getCard(edict.cardId);

    SpecialCaseEngine.onPlay(game, card, edict);
    expect(game.instances[weak.instanceId]).toBeUndefined();
    expect(game.instances[strong.instanceId]).toBeDefined();
  });
});

describe("Rampage (ven-83)", () => {
  it("duels the strongest friendly unit against the weakest enemy anywhere", () => {
    const game = makeGame();
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const weakEnemy = putOnBase(game, "unit-doomed-recruit", "1");
    const rampageInst = putOnBase(game, "ven-83", "0");
    const card = getCard(rampageInst.cardId);

    SpecialCaseEngine.onPlay(game, card, rampageInst);
    expect(game.instances[weakEnemy.instanceId]).toBeUndefined();
    expect(game.instances[strong.instanceId].damage).toBe(1);
  });
});

describe("Red Brambleback (unl-29)", () => {
  it("buffs the controller's strongest ready unbuffed unit when it conquers", () => {
    const game = makeGame();
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    // Exhausted, matching a real conquering attacker (already moved/attacked to get here) —
    // excludes it from being its own buff target.
    const brambleback = putOnBase(game, "unl-29", "0", { exhausted: true });
    const card = getCard(brambleback.cardId);

    SpecialCaseEngine.onConquer(game, card, brambleback, 0);
    expect(strong.statuses.buffed).toBe(true);
    expect(weak.statuses.buffed).toBeFalsy();
  });
});

describe("Rally the Troops (sfd-166)", () => {
  it("buffs friendly units played later this turn and draws 1", () => {
    const game = makeGame();
    const rally = putOnBase(game, "sfd-166", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(rally.cardId);

    SpecialCaseEngine.onPlay(game, card, rally);
    expect(game.players["0"].buffUnitsPlayedThisTurn).toBe(true);
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);

    const played = createInstance(game, "unit-blazing-scorcher", "0");
    resolvePlayedCard(game, game.players["0"], getCard("unit-blazing-scorcher"), played, undefined, false);
    expect(played.statuses.buffed).toBe(true);
  });
});
