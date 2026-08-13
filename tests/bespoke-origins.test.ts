import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof playCard>[0];
}

function moveToBattlefield(game: ReturnType<typeof makeGame>, instanceId: string, battlefieldIndex: number) {
  const instance = game.instances[instanceId];
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  game.battlefields[battlefieldIndex].units[instance.controller].push(instanceId);
}

describe("Cleave (ogn-4): grant Assault 3 this turn", () => {
  it("gives the target +3 Might only while attacking, and it fades", () => {
    const game = makeGame();
    const cleave = putOnBase(game, "ogn-4", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    const baseline = computeMight(game, getCard, target, "attacking");

    SpecialCaseEngine.onPlay(game, getCard(cleave.cardId), cleave, target.instanceId);

    expect(computeMight(game, getCard, target, "attacking")).toBe(baseline + 3);
    expect(computeMight(game, getCard, target, "defending")).toBe(baseline);

    target.grantedThisTurn = []; // simulate turn-boundary reset (see turnFlow.runTurnStart)
    expect(computeMight(game, getCard, target, "attacking")).toBe(baseline);
  });
});

describe("Disintegrate (ogn-5): deal 3, draw if it kills", () => {
  it("draws a card when the target dies", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const spell = putOnBase(game, "ogn-5", "0");
    const target = putOnBase(game, "unit-plain-guard", "1"); // Might 1, dies to 3 damage

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("unit-plain-footman");
  });

  it("does not draw when the target survives", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const spell = putOnBase(game, "ogn-5", "0");
    const target = putOnBase(game, "unit-vanguard-striker", "1");
    target.tempMightBonus = 10; // simulate enough effective Might to survive 3 damage

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Captain Farron (ogn-15): allies here have Assault", () => {
  it("buffs an ally at the same battlefield while attacking, not elsewhere", () => {
    const game = makeGame();
    const farron = putOnBase(game, "ogn-15", "0");
    const allyHere = putOnBase(game, "unit-plain-footman", "0");
    const allyElsewhere = putOnBase(game, "unit-plain-guard", "0");
    moveToBattlefield(game, farron.instanceId, 0);
    moveToBattlefield(game, allyHere.instanceId, 0);
    moveToBattlefield(game, allyElsewhere.instanceId, 1);

    const hereBonus = SpecialCaseEngine.attackingMightBonusFromAllies(game, getCard, allyHere);
    const elsewhereBonus = SpecialCaseEngine.attackingMightBonusFromAllies(game, getCard, allyElsewhere);

    expect(hereBonus).toBe(1);
    expect(elsewhereBonus).toBe(0);
  });
});

describe("Thermo Beam (ogn-22): kill all gear", () => {
  it("destroys every gear on the board, both players, leaves units alone", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-22", "0");
    const myGear = putOnBase(game, "gear-tactical-banner", "0");
    const theirGear = putOnBase(game, "gear-tactical-banner", "1");
    const unit = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, undefined);

    expect(game.instances[myGear.instanceId]).toBeUndefined();
    expect(game.instances[theirGear.instanceId]).toBeUndefined();
    expect(game.instances[unit.instanceId]).toBeDefined();
  });
});

describe("Magma Wurm (ogn-11): other friendly units enter ready", () => {
  it("makes a newly-played friendly unit enter ready via the real playCard move", () => {
    const game = makeGame();
    putOnBase(game, "ogn-11", "0", { exhausted: false });
    game.players["0"].hand = ["unit-plain-footman"]; // Energy 1
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    const result = playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["r1"], powerRuneIds: [] });

    expect(result).toBeUndefined();
    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "unit-plain-footman");
    expect(newInstanceId).toBeDefined();
    expect(game.instances[newInstanceId!].exhausted).toBe(false);
  });

  it("does not affect the opponent's newly-played units", () => {
    const game = makeGame();
    putOnBase(game, "ogn-11", "0", { exhausted: false });
    game.players["1"].hand = ["unit-plain-footman"];
    game.players["1"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    playCard(ctx(game, "1"), { handIndex: 0, energyRuneIds: ["r1"], powerRuneIds: [] });

    const newInstanceId = game.players["1"].base.find((id) => game.instances[id].cardId === "unit-plain-footman");
    expect(game.instances[newInstanceId!].exhausted).toBe(true);
  });
});

describe("Adaptatron (ogn-56): on conquer, may sacrifice a gear to buff self", () => {
  it("kills the controller's own gear and buffs Adaptatron when conquering", () => {
    const game = makeGame();
    const adaptatron = putOnBase(game, "ogn-56", "0");
    const gear = putOnBase(game, "gear-tactical-banner", "0");
    moveToBattlefield(game, adaptatron.instanceId, 0);

    SpecialCaseEngine.onConquer(game, getCard(adaptatron.cardId), adaptatron);

    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(adaptatron.statuses.buffed).toBe(true);
  });

  it("does nothing if there's no gear to sacrifice", () => {
    const game = makeGame();
    const adaptatron = putOnBase(game, "ogn-56", "0");
    moveToBattlefield(game, adaptatron.instanceId, 0);

    SpecialCaseEngine.onConquer(game, getCard(adaptatron.cardId), adaptatron);

    expect(adaptatron.statuses.buffed).toBeUndefined();
  });
});

describe("Draven, Showboat (ogn-28): Might increased by controller's points", () => {
  it("adds the controller's current points to base Might", () => {
    const game = makeGame();
    const draven = putOnBase(game, "ogn-28", "0");
    const baseline = computeMight(game, getCard, draven, "none");

    game.players["0"].points = 4;

    expect(computeMight(game, getCard, draven, "none")).toBe(baseline + 4);
  });
});

describe("Wielder of Water (ogn-55): +2 Might while attacking or defending alone", () => {
  it("gets the bonus when alone at its battlefield, not when accompanied", () => {
    const game = makeGame();
    const wielder = putOnBase(game, "ogn-55", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, wielder.instanceId, 0);
    const alone = computeMight(game, getCard, wielder, "attacking");

    moveToBattlefield(game, ally.instanceId, 0);
    const accompanied = computeMight(game, getCard, wielder, "attacking");

    expect(alone - accompanied).toBe(2);
  });
});

describe("Rune Prison / Solari Shieldbearer (shared stun-any-unit): can stun either side", () => {
  it("stuns a friendly unit just as well as an enemy one", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-50", "0");
    const friendly = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, friendly.instanceId);

    expect(friendly.statuses.stunned).toBe(true);
  });

  it("Solari Shieldbearer shares the exact same handler behavior", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ogn-51", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1");

    SpecialCaseEngine.onPlay(game, getCard(unit.cardId), unit, enemy.instanceId);

    expect(enemy.statuses.stunned).toBe(true);
  });
});

describe("Raging Soul (ogn-19): conditional Assault, data-bug workaround", () => {
  it("has no net Assault bonus when no card was discarded this turn", () => {
    const game = makeGame();
    const soul = putOnBase(game, "ogn-19", "0");
    const card = getCard(soul.cardId);
    const withAssaultKeywordOnly = card.might! + 1; // printed (mis-imported unconditional) Assault 1
    const attacking = computeMight(game, getCard, soul, "attacking");

    expect(attacking).toBe(card.might); // neutralized back down to base
    expect(attacking).not.toBe(withAssaultKeywordOnly);
  });

  it("keeps the +1 Assault once a card has been discarded this turn", () => {
    const game = makeGame();
    const soul = putOnBase(game, "ogn-19", "0");
    const card = getCard(soul.cardId);
    game.players["0"].discardedCardThisTurn = true;

    expect(computeMight(game, getCard, soul, "attacking")).toBe(card.might! + 1);
  });
});

describe("Darius, Trifarian (ogn-27): buffed on the controller's second card of the turn", () => {
  it("does nothing on the first card, triggers on the second, not the third", () => {
    const game = makeGame();
    const darius = putOnBase(game, "ogn-27", "0", { exhausted: true });
    const card = getCard(darius.cardId);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", card, 1);
    expect(darius.tempMightBonus).toBe(0);
    expect(darius.exhausted).toBe(true);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", card, 2);
    expect(darius.tempMightBonus).toBe(2);
    expect(darius.exhausted).toBe(false);

    darius.exhausted = true; // simulate it having acted again since
    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", card, 3);
    expect(darius.tempMightBonus).toBe(2); // unchanged, still just the one grant
    expect(darius.exhausted).toBe(true);
  });

  it("does not react to the opponent playing their second card", () => {
    const game = makeGame();
    const darius = putOnBase(game, "ogn-27", "0", { exhausted: true });

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "1", getCard(darius.cardId), 2);

    expect(darius.tempMightBonus).toBe(0);
    expect(darius.exhausted).toBe(true);
  });
});

describe("Caitlyn, Patrolling (ogn-68): Exhaust, deal damage equal to my Might", () => {
  it("deals damage equal to its own current Might, only while at a battlefield", () => {
    const game = makeGame();
    const caitlyn = putOnBase(game, "ogn-68", "0", { exhausted: false });
    const target = putOnBase(game, "unit-vanguard-striker", "1");
    moveToBattlefield(game, caitlyn.instanceId, 0);
    moveToBattlefield(game, target.instanceId, 0);
    const expectedDamage = computeMight(game, getCard, caitlyn, "none");

    SpecialCaseEngine.onActivate(game, getCard(caitlyn.cardId), caitlyn, target.instanceId);

    expect(target.damage).toBe(expectedDamage);
  });

  it("does nothing while not at a battlefield", () => {
    const game = makeGame();
    const caitlyn = putOnBase(game, "ogn-68", "0", { exhausted: false }); // still on base, not a battlefield
    const target = putOnBase(game, "unit-vanguard-striker", "1");

    SpecialCaseEngine.onActivate(game, getCard(caitlyn.cardId), caitlyn, target.instanceId);

    expect(target.damage).toBe(0);
  });
});

describe("Eclipse Herald (ogn-59): ready + buff when I stun an enemy unit", () => {
  it("readies itself and gains +1 Might this turn when its controller stuns an enemy", () => {
    const game = makeGame();
    const herald = putOnBase(game, "ogn-59", "0", { exhausted: true });
    const stunSpell = putOnBase(game, "ogn-50", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1");

    SpecialCaseEngine.onPlay(game, getCard(stunSpell.cardId), stunSpell, enemy.instanceId);

    expect(enemy.statuses.stunned).toBe(true);
    expect(herald.exhausted).toBe(false);
    expect(herald.tempMightBonus).toBe(1);
  });

  it("does not react when the opponent stuns a unit", () => {
    const game = makeGame();
    const herald = putOnBase(game, "ogn-59", "1", { exhausted: true });
    const stunSpell = putOnBase(game, "ogn-50", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1");

    SpecialCaseEngine.onPlay(game, getCard(stunSpell.cardId), stunSpell, enemy.instanceId);

    expect(herald.exhausted).toBe(true);
    expect(herald.tempMightBonus).toBe(0);
  });
});

describe("Wizened Elder (ogn-65): extra +1 Might while buffed", () => {
  it("stacks its own bonus on top of the standard Buff +1", () => {
    const game = makeGame();
    const elder = putOnBase(game, "ogn-65", "0");
    const card = getCard(elder.cardId);
    const baseline = computeMight(game, getCard, elder, "none");

    elder.statuses.buffed = true;

    expect(computeMight(game, getCard, elder, "none")).toBe(baseline + 2); // +1 standard Buff, +1 Wizened Elder's own
    expect(card.might).toBe(baseline);
  });
});
