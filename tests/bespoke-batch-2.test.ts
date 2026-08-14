import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Iterative Design (ven-51)", () => {
  it("plays a 3 Might Mech unit token to the controller's base", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-51", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    const tokenId = game.players["0"].base.find((id) => id !== spell.instanceId);
    expect(tokenId).toBeDefined();
    const token = game.instances[tokenId!];
    expect(token.cardId).toBe("token-mech-3");
    expect(getCard(token.cardId).might).toBe(3);
  });
});

describe("Desert's Call (sfd-31)", () => {
  it("plays a 2 Might Sand Soldier unit token to the controller's base", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-31", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    const tokenId = game.players["0"].base.find((id) => id !== spell.instanceId);
    expect(tokenId).toBeDefined();
    const token = game.instances[tokenId!];
    expect(token.cardId).toBe("token-sand-soldier-2");
    expect(getCard(token.cardId).might).toBe(2);
  });
});

describe("Kinkou Temple (ven-159, Battlefield static Might for Tank units)", () => {
  it("buffs a unit with the printed Tank keyword sitting here, not one without it", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "ven-159", units: { "0": [], "1": [] }, controller: null };

    const tank = putOnBase(game, "unit-doomed-recruit", "0"); // no Tank keyword, used only as a non-Tank baseline
    tank.zone = "battlefield";
    tank.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(tank.instanceId);
    expect(SpecialCaseEngine.staticMightModifierFromBattlefield(game, getCard, tank)).toBe(0);

    // Grant Tank via grantedThisTurn to simulate a Tank unit sitting here.
    tank.grantedThisTurn.push({ keyword: "tank" });
    expect(SpecialCaseEngine.staticMightModifierFromBattlefield(game, getCard, tank)).toBe(1);
  });
});

describe("Blood Rush (sfd-3)", () => {
  it("grants the target Assault 2 this turn", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-plain-footman", "0");
    const spell = putOnBase(game, "sfd-3", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(target.grantedThisTurn).toContainEqual({ keyword: "assault", value: 2 });
  });
});

describe("Twilight Reveler (ven-20)", () => {
  it("readies another exhausted friendly unit when it attacks, not itself", () => {
    const game = makeGame();
    const reveler = putOnBase(game, "ven-20", "0", { exhausted: false });
    const ally = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });
    const card = getCard(reveler.cardId);

    SpecialCaseEngine.onAttack(game, card, reveler);

    expect(ally.exhausted).toBe(false);
    expect(reveler.exhausted).toBe(false);
  });

  it("does nothing when there is no other exhausted friendly unit", () => {
    const game = makeGame();
    const reveler = putOnBase(game, "ven-20", "0", { exhausted: false });
    const ally = putOnBase(game, "unit-plain-footman", "0", { exhausted: false });
    const card = getCard(reveler.cardId);

    SpecialCaseEngine.onAttack(game, card, reveler);

    expect(ally.exhausted).toBe(false);
  });
});
