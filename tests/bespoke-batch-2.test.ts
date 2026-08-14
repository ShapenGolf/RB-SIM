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

describe("Eclipse Dragon (ven-16)", () => {
  it("draws a card on move when the controller has 4 or fewer runes", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const dragon = putOnBase(game, "ven-16", "0");
    const card = getCard(dragon.cardId);

    SpecialCaseEngine.onMove(game, card, dragon);

    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
  });

  it("doesn't draw when the controller has more than 4 runes", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-footman"];
    game.players["0"].runePool = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `rune-${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));
    const dragon = putOnBase(game, "ven-16", "0");
    const card = getCard(dragon.cardId);

    SpecialCaseEngine.onMove(game, card, dragon);

    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Hidden Blade (ogn-213)", () => {
  it("kills a unit at a battlefield and draws 2 for its controller", () => {
    const game = makeGame();
    game.players["1"].mainDeck = ["unit-plain-footman", "unit-plain-guard"];
    const target = putOnBase(game, "unit-plain-footman", "1");
    target.zone = "battlefield";
    target.battlefieldIndex = 0;
    game.battlefields[0].units["1"].push(target.instanceId);
    const spell = putOnBase(game, "ogn-213", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toEqual(["unit-plain-footman", "unit-plain-guard"]);
  });

  it("does nothing if the target isn't at a battlefield", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-plain-footman", "1");
    const spell = putOnBase(game, "ogn-213", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Reluctant Leader (ven-121)", () => {
  it("gains +2 Might when another unit is played, but not from its own play", () => {
    const game = makeGame();
    const leader = putOnBase(game, "ven-121", "0");
    const leaderCard = getCard(leader.cardId);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", leaderCard, 1);
    expect(leader.tempMightBonus).toBe(0);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("unit-plain-footman"), 2);
    expect(leader.tempMightBonus).toBe(2);
  });
});

describe("Square Up (unl-17)", () => {
  it("grants the target Assault 4 this turn", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-plain-footman", "0");
    const spell = putOnBase(game, "unl-17", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(target.grantedThisTurn).toContainEqual({ keyword: "assault", value: 4 });
  });
});

describe("Shadow Assassin (ven-13)", () => {
  it("enters ready only if a card with its own name is in the controller's trash", () => {
    const game = makeGame();
    const assassin = putOnBase(game, "ven-13", "0");
    const card = getCard(assassin.cardId);

    expect(SpecialCaseEngine.selfEntersReady(game, card, assassin)).toBe(false);

    game.players["0"].trash.push(assassin.cardId);
    expect(SpecialCaseEngine.selfEntersReady(game, card, assassin)).toBe(true);
  });
});

describe("Shadowblade Lurker (ven-96)", () => {
  it("reduces its own cost by 2 for each copy of its name in the controller's trash, floored at 0", () => {
    const game = makeGame();
    const lurker = putOnBase(game, "ven-96", "0");
    const card = getCard(lurker.cardId);
    const baseCost = card.energyCost ?? 0;

    expect(SpecialCaseEngine.costReduction(game, card, lurker)).toBe(0);

    game.players["0"].trash.push(lurker.cardId, lurker.cardId, lurker.cardId, lurker.cardId);
    expect(SpecialCaseEngine.costReduction(game, card, lurker)).toBe(baseCost);
  });
});

describe("Applied Researchers (ven-55)", () => {
  it("reduces an ally's spell cost by 1 only while Empowered", () => {
    const game = makeGame();
    const researchers = putOnBase(game, "ven-55", "0");
    const spell = putOnBase(game, "spell-dangerous-duo", "0");
    const spellCard = getCard(spell.cardId);

    expect(SpecialCaseEngine.costReductionFromAllies(game, getCard, spell, spellCard)).toBe(0);

    researchers.statuses.empowered = true;
    expect(SpecialCaseEngine.costReductionFromAllies(game, getCard, spell, spellCard)).toBe(1);
  });
});
