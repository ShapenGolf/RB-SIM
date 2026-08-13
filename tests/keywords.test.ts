import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { KeywordEngine } from "../src/keywords/registry";
import { computeMight } from "../src/game/might";
import { makeGame, putOnBase } from "./helpers";

describe("Stun", () => {
  it("prevents combat damage regardless of printed keywords", () => {
    const game = makeGame();
    const footman = putOnBase(game, "unit-plain-footman", "0");
    expect(KeywordEngine.preventsCombatDamage(game, getCard(footman.cardId), footman)).toBe(false);

    footman.statuses.stunned = true;
    expect(KeywordEngine.preventsCombatDamage(game, getCard(footman.cardId), footman)).toBe(true);
  });
});

describe("Shield", () => {
  it("adds Might only while defending", () => {
    const game = makeGame();
    const shieldbearer = putOnBase(game, "unit-shieldbearer", "0");
    const card = getCard(shieldbearer.cardId);
    const attacking = computeMight(game, getCard, shieldbearer, "attacking");
    const defending = computeMight(game, getCard, shieldbearer, "defending");
    expect(defending - attacking).toBe(2);
    expect(attacking).toBe(card.might);
  });
});

describe("Assault", () => {
  it("adds Might only while attacking", () => {
    const game = makeGame();
    const striker = putOnBase(game, "unit-vanguard-striker", "0");
    const card = getCard(striker.cardId);
    const attacking = computeMight(game, getCard, striker, "attacking");
    const defending = computeMight(game, getCard, striker, "defending");
    expect(attacking - defending).toBe(2);
    expect(defending).toBe(card.might);
  });
});

describe("Legion", () => {
  it("is only active once another Main Deck card was already played this turn", () => {
    const game = makeGame();
    const duo = putOnBase(game, "spell-dangerous-duo", "0");
    const card = getCard(duo.cardId);

    expect(KeywordEngine.conditionalTriggerActive(game, card, duo)).toBe(false);

    game.players["0"].playedMainDeckCardThisTurn = true;
    expect(KeywordEngine.conditionalTriggerActive(game, card, duo)).toBe(true);
  });
});

describe("Hunt", () => {
  it("reports its XP value for the conquer/hold hook", () => {
    const game = makeGame();
    const hound = putOnBase(game, "unit-tracking-hound", "0");
    const card = getCard(hound.cardId);
    expect(KeywordEngine.xpOnConquerOrHold(game, card, hound)).toBe(1);
  });
});

describe("Accelerate", () => {
  it("reports its extra Energy cost and ready-on-play effect", () => {
    const game = makeGame();
    const scorcher = putOnBase(game, "unit-blazing-scorcher", "0");
    const card = getCard(scorcher.cardId);
    expect(KeywordEngine.additionalPlayCostEnergy(game, card, scorcher)).toBe(1);
    expect(KeywordEngine.entersReadyIfCostPaid(game, card, scorcher)).toBe(true);
  });
});

describe("Deflect", () => {
  it("reports its extra targeting cost", () => {
    const game = makeGame();
    const warden = putOnBase(game, "unit-elusive-warden", "0");
    const card = getCard(warden.cardId);
    expect(KeywordEngine.extraTargetingCost(game, card, warden)).toBe(1);
  });
});

describe("Ambush", () => {
  it("allows play to an occupied battlefield and grants Reaction timing in the main phase", () => {
    const game = makeGame();
    const infiltrator = putOnBase(game, "unit-shadow-infiltrator", "0");
    const card = getCard(infiltrator.cardId);
    expect(KeywordEngine.allowsPlayToOccupiedBattlefield(game, card, infiltrator)).toBe(true);
    expect(KeywordEngine.grantsReactionTiming(game, card, infiltrator)).toBe(true);
  });
});
