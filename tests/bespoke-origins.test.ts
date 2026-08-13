import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { playCard, activateAbility, attackBattlefield, resolveOptionalCost, endTurn } from "../src/game/moves";
import { destroyInstance, resolveHoldTriggers } from "../src/game/combat";
import { runBeginning, runTurnStart } from "../src/game/turnFlow";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof playCard>[0];
}

function endTurnFor(G: GameState, playerID: "0" | "1") {
  endTurn({ G, playerID, events: { endTurn: () => {} } } as unknown as Parameters<typeof endTurn>[0], undefined as never);
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

    SpecialCaseEngine.onConquer(game, getCard(adaptatron.cardId), adaptatron, 0);

    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(adaptatron.statuses.buffed).toBe(true);
  });

  it("does nothing if there's no gear to sacrifice", () => {
    const game = makeGame();
    const adaptatron = putOnBase(game, "ogn-56", "0");
    moveToBattlefield(game, adaptatron.instanceId, 0);

    SpecialCaseEngine.onConquer(game, getCard(adaptatron.cardId), adaptatron, 0);

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

describe("Brazen Buccaneer (ogn-2): discard 1 as additional cost to reduce cost by 2", () => {
  it("costs 2 Energy less and discards a card when the additional cost is paid", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-2", "unit-plain-footman"];
    const card = getCard("ogn-2");
    game.players["0"].runePool = Array.from({ length: card.energyCost! - 2 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
      payAdditionalCost: true,
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].trash).toContain("unit-plain-footman");
    expect(game.players["0"].discardedCardThisTurn).toBe(true);
  });

  it("costs full price and discards nothing when the additional cost isn't paid", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-2", "unit-plain-footman"];
    const card = getCard("ogn-2");
    game.players["0"].runePool = Array.from({ length: card.energyCost! }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
      payAdditionalCost: false,
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
    expect(game.players["0"].discardedCardThisTurn).toBe(false);
  });

  it("cannot pay the additional cost with nothing else in hand to discard", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-2"];
    const card = getCard("ogn-2");
    game.players["0"].runePool = Array.from({ length: card.energyCost! - 2 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
      payAdditionalCost: true,
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Get Excited! (ogn-8): discard 1, deal its Energy cost as damage", () => {
  it("deals damage equal to the discarded card's Energy cost", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-8", "0");
    game.players["0"].hand = ["ogn-4"]; // Cleave, Energy 2
    const target = putOnBase(game, "unit-vanguard-striker", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.damage).toBe(getCard("ogn-4").energyCost);
    expect(game.players["0"].trash).toContain("ogn-4");
    expect(game.players["0"].discardedCardThisTurn).toBe(true);
  });

  it("destroys the target if the damage is lethal", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-8", "0");
    game.players["0"].hand = ["ogn-2"]; // Brazen Buccaneer, Energy 6
    const target = putOnBase(game, "unit-plain-guard", "1"); // low Might

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("does nothing if hand is empty", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-8", "0");
    game.players["0"].hand = [];
    const target = putOnBase(game, "unit-vanguard-striker", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.damage).toBe(0);
  });
});

describe("Noxus Hopeful (ogn-12): Legion — costs 2 Energy less", () => {
  it("costs full price as the first card played this turn", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-12"];
    const card = getCard("ogn-12");
    game.players["0"].runePool = Array.from({ length: card.energyCost! }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const tooFew = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.slice(0, card.energyCost! - 2).map((r) => r.instanceId),
      powerRuneIds: [],
    });
    expect(tooFew).toBe(INVALID_MOVE);

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
    });
    expect(result).toBeUndefined();
  });

  it("costs 2 Energy less once another card was already played this turn", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-12"];
    game.players["0"].playedMainDeckCardThisTurn = true;
    const card = getCard("ogn-12");
    game.players["0"].runePool = Array.from({ length: card.energyCost! - 2 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
    });

    expect(result).toBeUndefined();
  });
});

describe("Sky Splitter (ogn-14): cost reduced by highest Might unit you control", () => {
  it("reduces its Energy cost by the controller's highest-Might unit, deals 5 to the target", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-14"];
    const card = getCard("ogn-14");
    putOnBase(game, "unit-vanguard-striker", "0"); // higher Might than footman
    const target = putOnBase(game, "unit-plain-guard", "1");
    const highest = Math.max(
      ...game.players["0"].base.map((id) => computeMight(game, getCard, game.instances[id], "none")),
    );
    const runeCount = Math.max(0, card.energyCost! - highest);
    game.players["0"].runePool = [
      { instanceId: "power", domain: "Fury" as const, exhausted: false },
      ...Array.from({ length: runeCount }, (_, i) => ({
        instanceId: `r${i}`,
        domain: "Fury" as const,
        exhausted: false,
      })),
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(target.damage).toBe(5);
  });

  it("costs full price with no units controlled", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-14"];
    const card = getCard("ogn-14");
    const target = putOnBase(game, "unit-plain-guard", "1");
    game.players["0"].runePool = [
      { instanceId: "power", domain: "Fury" as const, exhausted: false },
      ...Array.from({ length: card.energyCost! - 1 }, (_, i) => ({
        instanceId: `r${i}`,
        domain: "Fury" as const,
        exhausted: false,
      })),
    ];

    const tooFew = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
      targetInstanceId: target.instanceId,
    });

    expect(tooFew).toBe(INVALID_MOVE);
  });
});

describe("Scrapyard Champion (ogn-20): Legion — discard 2, then draw 2", () => {
  it("discards 2 and draws 2 when Legion is active", () => {
    const game = makeGame();
    const champ = putOnBase(game, "ogn-20", "0");
    game.players["0"].playedMainDeckCardThisTurn = true;
    game.players["0"].hand = ["unit-plain-footman", "unit-plain-guard"];
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];

    SpecialCaseEngine.onPlay(game, getCard(champ.cardId), champ);

    expect(game.players["0"].hand).toEqual(["ogn-4", "ogn-5"]);
    expect(game.players["0"].trash).toEqual(["unit-plain-footman", "unit-plain-guard"]);
    expect(game.players["0"].discardedCardThisTurn).toBe(true);
  });

  it("does nothing when Legion isn't active", () => {
    const game = makeGame();
    const champ = putOnBase(game, "ogn-20", "0");
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(champ.cardId), champ);

    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
    expect(game.players["0"].mainDeck).toEqual(["ogn-4"]);
  });
});

describe("Sun Disc (ogn-21): Exhaust, Legion — next unit enters ready", () => {
  it("makes the next unit played this turn enter ready, then clears itself", () => {
    const game = makeGame();
    const disc = putOnBase(game, "ogn-21", "0", { exhausted: false });
    game.players["0"].playedMainDeckCardThisTurn = true;

    SpecialCaseEngine.onActivate(game, getCard(disc.cardId), disc);
    expect(disc.exhausted).toBe(false); // exhaustSelf is handled by activateAbility move, not onActivate
    expect(game.players["0"].nextUnitEntersReady).toBe(true);

    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["r1"], powerRuneIds: [] });

    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "unit-plain-footman");
    expect(game.instances[newInstanceId!].exhausted).toBe(false);
    expect(game.players["0"].nextUnitEntersReady).toBe(false);
  });

  it("does nothing when Legion isn't active", () => {
    const game = makeGame();
    const disc = putOnBase(game, "ogn-21", "0", { exhausted: false });

    SpecialCaseEngine.onActivate(game, getCard(disc.cardId), disc);

    expect(game.players["0"].nextUnitEntersReady).toBe(false);
  });
});

describe("Blind Fury (ogn-25): reveal, banish, and play opponent's top deck card free", () => {
  it("banishes the opponent's top card and plays it under the caster's control", () => {
    const game = makeGame();
    const fury = putOnBase(game, "ogn-25", "0");
    game.players["1"].mainDeck = ["unit-plain-footman"];

    SpecialCaseEngine.onPlay(game, getCard(fury.cardId), fury);

    expect(game.players["1"].mainDeck).toEqual([]);
    expect(game.players["1"].banishment).toContain("unit-plain-footman");
    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "unit-plain-footman");
    expect(newInstanceId).toBeDefined();
    expect(game.instances[newInstanceId!].controller).toBe("0");
  });

  it("does nothing if the opponent's deck is empty", () => {
    const game = makeGame();
    const fury = putOnBase(game, "ogn-25", "0");
    game.players["1"].mainDeck = [];

    SpecialCaseEngine.onPlay(game, getCard(fury.cardId), fury);

    expect(game.players["1"].banishment).toEqual([]);
  });
});

describe("Brynhir Thundersong (ogn-26): opponents can't play cards this turn", () => {
  it("resolves as a documented no-op given the engine's single-active-player turn structure", () => {
    const game = makeGame();
    const brynhir = putOnBase(game, "ogn-26", "0");

    expect(() => SpecialCaseEngine.onPlay(game, getCard(brynhir.cardId), brynhir)).not.toThrow();
  });
});

describe("Falling Star (ogn-29): deal 3 to a unit, twice (simplified to 6 on one target)", () => {
  it("deals 6 total damage to the chosen target", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-29", "0");
    const target = putOnBase(game, "unit-vanguard-striker", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.damage).toBe(6);
  });
});

describe("Raging Firebrand (ogn-31): next spell you play this turn costs 5 Energy less", () => {
  it("reduces the next spell's cost by 5, then clears itself", () => {
    const game = makeGame();
    const firebrand = putOnBase(game, "ogn-31", "0");

    SpecialCaseEngine.onPlay(game, getCard(firebrand.cardId), firebrand);
    expect(game.players["0"].nextSpellCostReduction).toBe(5);

    game.players["0"].hand = ["ogn-8"]; // Get Excited!, Energy 2, Power 1 Fury
    game.players["0"].runePool = [{ instanceId: "power", domain: "Fury", exhausted: false }];
    const target = putOnBase(game, "unit-vanguard-striker", "1");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: [],
      powerRuneIds: ["power"],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].nextSpellCostReduction).toBe(0);
  });
});

describe("Tryndamere, Barbarian (ogn-34): score a point on 5+ excess damage conquer", () => {
  it("scores a point when excess damage is 5 or more", () => {
    const game = makeGame();
    const tryndamere = putOnBase(game, "ogn-34", "0");
    game.players["0"].points = 0;

    SpecialCaseEngine.onConquer(game, getCard(tryndamere.cardId), tryndamere, 5);

    expect(game.players["0"].points).toBe(1);
  });

  it("does not score with less than 5 excess damage", () => {
    const game = makeGame();
    const tryndamere = putOnBase(game, "ogn-34", "0");
    game.players["0"].points = 0;

    SpecialCaseEngine.onConquer(game, getCard(tryndamere.cardId), tryndamere, 4);

    expect(game.players["0"].points).toBe(0);
  });
});

describe("Vi, Destructive (ogn-36): Recycle 1 from trash to give +1 Might this turn", () => {
  it("recycles the front of trash into the deck and buffs itself", () => {
    const game = makeGame();
    const vi = putOnBase(game, "ogn-36", "0", { exhausted: false });
    game.players["0"].trash = ["ogn-4", "ogn-5"];
    game.players["0"].mainDeck = [];

    const result = activateAbility(ctx(game, "0"), { instanceId: vi.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.players["0"].trash).toEqual(["ogn-5"]);
    expect(game.players["0"].mainDeck).toEqual(["ogn-4"]);
    expect(vi.tempMightBonus).toBe(1);
  });

  it("fails if the trash is empty", () => {
    const game = makeGame();
    const vi = putOnBase(game, "ogn-36", "0", { exhausted: false });
    game.players["0"].trash = [];

    const result = activateAbility(ctx(game, "0"), { instanceId: vi.instanceId, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Ganking (ogn-36 Vi, Destructive): can attack from battlefield to battlefield", () => {
  it("lets a Ganking unit move directly between battlefields", () => {
    const game = makeGame();
    const vi = putOnBase(game, "ogn-36", "0", { exhausted: false });
    moveToBattlefield(game, vi.instanceId, 0);

    const result = attackBattlefield(ctx(game, "0"), { battlefieldIndex: 1, unitInstanceIds: [vi.instanceId] });

    expect(result).toBeUndefined();
    expect(game.instances[vi.instanceId].battlefieldIndex).toBe(1);
    expect(game.battlefields[0].units["0"]).not.toContain(vi.instanceId);
    expect(game.battlefields[1].units["0"]).toContain(vi.instanceId);
  });

  it("blocks a non-Ganking unit from moving battlefield to battlefield", () => {
    const game = makeGame();
    const footman = putOnBase(game, "unit-plain-footman", "0", { exhausted: false });
    moveToBattlefield(game, footman.instanceId, 0);

    const result = attackBattlefield(ctx(game, "0"), {
      battlefieldIndex: 1,
      unitInstanceIds: [footman.instanceId],
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Immortal Phoenix (ogn-37): may pay to play from trash when you kill a unit with a spell", () => {
  it("offers the decision on a spell kill, and paying it moves the Phoenix from trash to base", () => {
    const game = makeGame();
    game.players["0"].trash = ["ogn-37"];
    const spell = putOnBase(game, "ogn-5", "0"); // Disintegrate, deals 3
    const target = putOnBase(game, "unit-plain-guard", "1"); // Might 1, dies

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.pendingOptionalCost).not.toBeNull();
    expect(game.pendingOptionalCost!.specialCaseId).toBe("immortal-phoenix");
    expect(game.pendingOptionalCost!.payload).toBe("ogn-37");
    expect(game.pendingOptionalCost!.cost).toEqual({ energy: 1, runeDomain: "Fury" });

    game.players["0"].runePool = [
      { instanceId: "e1", domain: "Fury" as const, exhausted: false },
      { instanceId: "power", domain: "Fury" as const, exhausted: false },
    ];
    const result = resolveOptionalCost(ctx(game, "0"), {
      pay: true,
      energyRuneIds: ["e1"],
      powerRuneId: "power",
    });

    expect(result).toBeUndefined();
    expect(game.pendingOptionalCost).toBeNull();
    expect(game.players["0"].trash).toEqual([]);
    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "ogn-37");
    expect(newInstanceId).toBeDefined();
  });

  it("declining leaves the Phoenix in trash and clears the pending decision", () => {
    const game = makeGame();
    game.players["0"].trash = ["ogn-37"];
    const spell = putOnBase(game, "ogn-5", "0");
    const target = putOnBase(game, "unit-plain-guard", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    const result = resolveOptionalCost(ctx(game, "0"), { pay: false, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.pendingOptionalCost).toBeNull();
    expect(game.players["0"].trash).toEqual(["ogn-37"]);
  });

  it("does not offer anything when the kill isn't from a spell", () => {
    const game = makeGame();
    game.players["0"].trash = ["ogn-37"];
    const target = putOnBase(game, "unit-plain-guard", "1");
    destroyInstance(game, getCard, target.instanceId);

    expect(game.pendingOptionalCost).toBeNull();
  });
});

describe("Kadregrin the Infernal (ogn-38): draw 1 per Mighty (5+ Might) unit you control", () => {
  it("draws once for itself (9 Might) plus once per other Mighty unit", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["ogn-4", "ogn-5", "ogn-8"];
    const mighty = putOnBase(game, "unit-vanguard-striker", "0");
    mighty.tempMightBonus = 5; // 2 base + 5 = 7, Mighty
    putOnBase(game, "unit-plain-footman", "0"); // Might 2, not Mighty
    const kadregrin = putOnBase(game, "ogn-38", "0");

    SpecialCaseEngine.onPlay(game, getCard(kadregrin.cardId), kadregrin);

    // Kadregrin itself (9 Might) + the buffed striker (7 Might) = 2 Mighty units.
    expect(game.players["0"].hand).toEqual(["ogn-4", "ogn-5"]);
  });
});

describe("Volibear, Furious (ogn-41): on attack, deal 5 split among enemy units here", () => {
  it("distributes damage across enemy units at the battlefield, killing what it can", () => {
    const game = makeGame();
    const voli = putOnBase(game, "ogn-41", "0", { exhausted: false });
    const enemy1 = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    const enemy2 = putOnBase(game, "unit-vanguard-striker", "1"); // Might 2
    moveToBattlefield(game, voli.instanceId, 0);
    moveToBattlefield(game, enemy1.instanceId, 0);
    moveToBattlefield(game, enemy2.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(voli.cardId), voli);

    expect(game.instances[enemy1.instanceId]).toBeUndefined();
    expect(game.instances[enemy2.instanceId]).toBeUndefined();
  });

  it("does nothing while not at a battlefield", () => {
    const game = makeGame();
    const voli = putOnBase(game, "ogn-41", "0", { exhausted: false });
    const enemy = putOnBase(game, "unit-plain-guard", "1");

    expect(() => SpecialCaseEngine.onAttack(game, getCard(voli.cardId), voli)).not.toThrow();
    expect(game.instances[enemy.instanceId]).toBeDefined();
  });
});

describe("Charm (ogn-43): move an enemy unit (assumed: back to base)", () => {
  it("sends a battlefield enemy unit back to their base", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-43", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, enemy.instanceId);

    expect(enemy.zone).toBe("base");
    expect(enemy.battlefieldIndex).toBeNull();
    expect(game.players["1"].base).toContain(enemy.instanceId);
    expect(game.battlefields[0].units["1"]).not.toContain(enemy.instanceId);
  });

  it("does nothing to a friendly unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-43", "0");
    const ally = putOnBase(game, "unit-plain-guard", "0");
    moveToBattlefield(game, ally.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, ally.instanceId);

    expect(ally.zone).toBe("battlefield");
  });
});

describe("En Garde (ogn-46): +1 Might, +1 more if the only unit there", () => {
  it("grants only +1 when accompanied", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-46", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    putOnBase(game, "unit-plain-guard", "0"); // another unit on the same base

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.tempMightBonus).toBe(1);
  });

  it("grants +2 when it's the only unit there", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-46", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.tempMightBonus).toBe(2);
  });
});

describe("Find Your Center (ogn-47): cost reduced near opponent victory, draw 1 + channel 1 exhausted", () => {
  it("draws a card and channels an exhausted rune", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-47", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    game.players["0"].runeDeck = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].hand).toContain("ogn-4");
    expect(game.players["0"].runePool).toEqual([{ instanceId: "r1", domain: "Fury", exhausted: true }]);
  });

  it("costs 2 Energy less once the opponent is within 3 of the Victory Score", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-47"];
    const card = getCard("ogn-47");
    game.players["1"].points = 5; // Victory Score 8 - 3
    game.players["0"].runePool = Array.from({ length: card.energyCost! - 2 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
    });

    expect(result).toBeUndefined();
  });
});

describe("Mask of Foresight (ogn-60): friendly units attacking/defending alone get +1 Might", () => {
  it("buffs a lone attacker at Mask's controller's battlefield", () => {
    const game = makeGame();
    putOnBase(game, "ogn-60", "0");
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, attacker.instanceId, 0);

    expect(computeMight(game, getCard, attacker, "attacking")).toBe(getCard("unit-plain-footman").might! + 1);
  });

  it("does not buff when accompanied by another friendly unit", () => {
    const game = makeGame();
    putOnBase(game, "ogn-60", "0");
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    const ally = putOnBase(game, "unit-plain-guard", "0");
    moveToBattlefield(game, attacker.instanceId, 0);
    moveToBattlefield(game, ally.instanceId, 0);

    expect(computeMight(game, getCard, attacker, "attacking")).toBe(getCard("unit-plain-footman").might);
  });

  it("buffs a lone defender too", () => {
    const game = makeGame();
    putOnBase(game, "ogn-60", "0");
    const defender = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, defender.instanceId, 0);

    expect(computeMight(game, getCard, defender, "defending")).toBe(getCard("unit-plain-footman").might! + 1);
  });
});

describe("Poro Herder (ogn-61): buff + draw if you control a Poro", () => {
  it("buffs itself and draws when a Poro is in play", () => {
    const game = makeGame();
    putOnBase(game, "ogn-210", "0"); // Daring Poro
    const herder = putOnBase(game, "ogn-61", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(herder.cardId), herder);

    expect(herder.statuses.buffed).toBe(true);
    expect(game.players["0"].hand).toContain("ogn-4");
  });

  it("does nothing without a Poro in play", () => {
    const game = makeGame();
    const herder = putOnBase(game, "ogn-61", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(herder.cardId), herder);

    expect(herder.statuses.buffed).toBeUndefined();
    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Spirit's Refuge (ogn-63): buff a friendly unit on play", () => {
  it("buffs the chosen friendly unit", () => {
    const game = makeGame();
    const refuge = putOnBase(game, "ogn-63", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onPlay(game, getCard(refuge.cardId), refuge, target.instanceId);

    expect(target.statuses.buffed).toBe(true);
  });

  it("does not buff an enemy unit", () => {
    const game = makeGame();
    const refuge = putOnBase(game, "ogn-63", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onPlay(game, getCard(refuge.cardId), refuge, enemy.instanceId);

    expect(enemy.statuses.buffed).toBeUndefined();
  });
});

describe("Ravenborn Tome (ogn-32): next spell deals +1 Bonus Damage", () => {
  it("adds +1 to the next spell's dealSpellDamage call, then clears itself via the real playCard move", () => {
    const game = makeGame();
    const tome = putOnBase(game, "ogn-32", "0", { exhausted: false });

    SpecialCaseEngine.onActivate(game, getCard(tome.cardId), tome);
    expect(game.players["0"].nextSpellBonusDamage).toBe(1);

    const target = putOnBase(game, "unit-vanguard-striker", "1");
    target.tempMightBonus = 2; // effective toughness 4: survives 3, dies to 3+1 bonus
    game.players["0"].hand = ["ogn-5"]; // Disintegrate, Energy 2, deals 3
    const card = getCard("ogn-5");
    game.players["0"].runePool = Array.from({ length: card.energyCost! }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(game.instances[target.instanceId]).toBeUndefined(); // proves the +1 bonus landed
    expect(game.players["0"].nextSpellBonusDamage).toBe(0);
  });
});

describe("Ambush: play a unit directly to a Battlefield where you already have units", () => {
  it("lets an Ambush unit enter play already committed to that Battlefield", () => {
    const game = makeGame();
    const anchor = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, anchor.instanceId, 0);
    game.players["0"].hand = ["unl-2"]; // Inferna, Ambush, Energy 2
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Fury" as const, exhausted: false },
      { instanceId: "r2", domain: "Fury" as const, exhausted: false },
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r1", "r2"],
      powerRuneIds: [],
      ambushBattlefieldIndex: 0,
    });

    expect(result).toBeUndefined();
    const newInstanceId = game.battlefields[0].units["0"].find((id) => game.instances[id].cardId === "unl-2");
    expect(newInstanceId).toBeDefined();
    expect(game.instances[newInstanceId!].zone).toBe("battlefield");
    expect(game.players["0"].base).not.toContain(newInstanceId);
  });

  it("rejects Ambush onto a Battlefield with no friendly units yet", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-2"];
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Fury" as const, exhausted: false },
      { instanceId: "r2", domain: "Fury" as const, exhausted: false },
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r1", "r2"],
      powerRuneIds: [],
      ambushBattlefieldIndex: 0,
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects a non-Ambush unit from playing directly to a Battlefield", () => {
    const game = makeGame();
    const anchor = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, anchor.instanceId, 0);
    game.players["0"].hand = ["unit-plain-guard"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r1"],
      powerRuneIds: [],
      ambushBattlefieldIndex: 0,
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Blitzcrank, Impassive (ogn-67): played to a battlefield, may move an enemy unit here", () => {
  it("champions may play directly to an empty battlefield without Ambush", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-67"];
    const card = getCard("ogn-67");
    game.players["0"].runePool = [{ instanceId: "power", domain: "Calm" as const, exhausted: false }].concat(
      Array.from({ length: card.energyCost! }, (_, i) => ({
        instanceId: `r${i}`,
        domain: "Calm" as const,
        exhausted: false,
      })),
    );

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
      ambushBattlefieldIndex: 0,
    });

    expect(result).toBeUndefined();
    const newInstanceId = game.battlefields[0].units["0"].find((id) => game.instances[id].cardId === "ogn-67");
    expect(newInstanceId).toBeDefined();
  });

  it("pulls a targeted enemy unit onto Blitzcrank's battlefield when played there", () => {
    const game = makeGame();
    const blitzcrank = putOnBase(game, "ogn-67", "0");
    blitzcrank.zone = "battlefield";
    blitzcrank.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(blitzcrank.instanceId);
    const enemy = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onPlay(game, getCard(blitzcrank.cardId), blitzcrank, enemy.instanceId);

    expect(enemy.zone).toBe("battlefield");
    expect(enemy.battlefieldIndex).toBe(0);
    expect(game.battlefields[0].units["1"]).toContain(enemy.instanceId);
    expect(game.players["1"].base).not.toContain(enemy.instanceId);
  });

  it("is a no-op when played to base instead of a battlefield", () => {
    const game = makeGame();
    const blitzcrank = putOnBase(game, "ogn-67", "0"); // zone stays "base"
    const enemy = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onPlay(game, getCard(blitzcrank.cardId), blitzcrank, enemy.instanceId);

    expect(enemy.zone).toBe("base");
  });

  it("returns to owner's hand when it holds a battlefield", () => {
    const game = makeGame();
    const blitzcrank = putOnBase(game, "ogn-67", "0");
    blitzcrank.zone = "battlefield";
    blitzcrank.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(blitzcrank.instanceId);
    game.battlefields[0].controller = "0";

    resolveHoldTriggers(game, getCard, "0");

    expect(game.instances[blitzcrank.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("ogn-67");
    expect(game.battlefields[0].units["0"]).not.toContain(blitzcrank.instanceId);
  });
});

describe("Temporary status: killed at the controller's next Beginning, before scoring", () => {
  it("kills a Temporary instance during runBeginning", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-plain-footman", "0");
    unit.statuses.temporary = true;

    runBeginning(game, "0");

    expect(game.instances[unit.instanceId]).toBeUndefined();
  });

  it("leaves non-Temporary units untouched", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-plain-footman", "0");

    runBeginning(game, "0");

    expect(game.instances[unit.instanceId]).toBeDefined();
  });
});

describe("Last Stand (ogn-69): double Might this turn, give it Temporary", () => {
  it("doubles the target's current effective Might and marks it Temporary", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-69", "0");
    const target = putOnBase(game, "unit-vanguard-striker", "0");
    const baseline = computeMight(game, getCard, target, "none");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(computeMight(game, getCard, target, "none")).toBe(baseline * 2);
    expect(target.statuses.temporary).toBe(true);
  });
});

describe("Solari Shrine (ogn-72): when you kill a stunned enemy unit, may exhaust to draw 1", () => {
  it("exhausts and draws when a stunned enemy unit dies to spell damage", () => {
    const game = makeGame();
    const shrine = putOnBase(game, "ogn-72", "0", { exhausted: false });
    const spell = putOnBase(game, "ogn-5", "0"); // Disintegrate, deals 3
    const target = putOnBase(game, "unit-plain-guard", "1");
    target.statuses.stunned = true;
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(shrine.exhausted).toBe(true);
    expect(game.players["0"].hand).toContain("ogn-4");
  });

  it("does not react to a non-stunned kill", () => {
    const game = makeGame();
    const shrine = putOnBase(game, "ogn-72", "0", { exhausted: false });
    const spell = putOnBase(game, "ogn-5", "0");
    const target = putOnBase(game, "unit-plain-guard", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    // Disintegrate's own "if this kills it, draw 1" still fires independently of Solari
    // Shrine — only the exhaust state distinguishes whether Solari Shrine itself reacted.
    expect(shrine.exhausted).toBe(false);
  });

  it("also reacts to a stunned unit killed in combat", () => {
    const game = makeGame();
    const shrine = putOnBase(game, "ogn-72", "0", { exhausted: false });
    const attacker = putOnBase(game, "unit-vanguard-striker", "0", { exhausted: false });
    const defender = putOnBase(game, "unit-plain-guard", "1");
    defender.statuses.stunned = true;
    moveToBattlefield(game, defender.instanceId, 0);
    game.players["0"].mainDeck = ["ogn-4"];

    const result = attackBattlefield(ctx(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(result).toBeUndefined();
    expect(shrine.exhausted).toBe(true);
    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Sona, Harmonious (ogn-73): ready 4 friendly runes at end of turn while at a battlefield", () => {
  it("readies up to 4 exhausted runes", () => {
    const game = makeGame();
    const sona = putOnBase(game, "ogn-73", "0");
    moveToBattlefield(game, sona.instanceId, 0);
    game.players["0"].runePool = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Calm" as const,
      exhausted: true,
    }));

    endTurnFor(game, "0");

    const readyCount = game.players["0"].runePool.filter((r) => !r.exhausted).length;
    expect(readyCount).toBe(4);
  });

  it("does nothing while not at a battlefield", () => {
    const game = makeGame();
    putOnBase(game, "ogn-73", "0");
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Calm" as const, exhausted: true }];

    endTurnFor(game, "0");

    expect(game.players["0"].runePool[0].exhausted).toBe(true);
  });
});

describe("Taric, Protector (ogn-74): other friendly units here have Shield", () => {
  it("gives a defending ally at the same battlefield +1 Might", () => {
    const game = makeGame();
    const taric = putOnBase(game, "ogn-74", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, taric.instanceId, 0);
    moveToBattlefield(game, ally.instanceId, 0);

    const bonus = SpecialCaseEngine.defendingMightBonusFromAllies(game, getCard, ally);

    expect(bonus).toBe(1);
  });
});

describe("Tasty Faefolk (ogn-75): Deathknell — channel 2 exhausted, draw 1", () => {
  it("channels 2 exhausted runes and draws on destroy", () => {
    const game = makeGame();
    const faefolk = putOnBase(game, "ogn-75", "0");
    game.players["0"].runeDeck = [
      { instanceId: "r1", domain: "Calm", exhausted: false },
      { instanceId: "r2", domain: "Calm", exhausted: false },
    ];
    game.players["0"].mainDeck = ["ogn-4"];

    destroyInstance(game, getCard, faefolk.instanceId);

    expect(game.players["0"].runePool.every((r) => r.exhausted)).toBe(true);
    expect(game.players["0"].runePool.length).toBe(2);
    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Watchful Sentry (ogn-96): Deathknell — draw 1", () => {
  it("draws a card on destroy", () => {
    const game = makeGame();
    const sentry = putOnBase(game, "ogn-96", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    destroyInstance(game, getCard, sentry.instanceId);

    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Lee Sin, Ascetic (ogn-78): Exhaust: Buff me, any number of buffs", () => {
  it("stacks Might with repeated activations", () => {
    const game = makeGame();
    const leeSin = putOnBase(game, "ogn-78", "0", { exhausted: false });
    const baseline = computeMight(game, getCard, leeSin, "none");

    activateAbility(ctx(game, "0"), { instanceId: leeSin.instanceId, energyRuneIds: [] });
    leeSin.exhausted = false; // simulate readying between activations
    activateAbility(ctx(game, "0"), { instanceId: leeSin.instanceId, energyRuneIds: [] });
    leeSin.exhausted = false;
    activateAbility(ctx(game, "0"), { instanceId: leeSin.instanceId, energyRuneIds: [] });

    expect(computeMight(game, getCard, leeSin, "none")).toBe(baseline + 3);
  });
});

describe("Yasuo, Remorseful (ogn-76): on attack, deal damage equal to my Might to an enemy unit here", () => {
  it("kills a weaker enemy unit at the same battlefield", () => {
    const game = makeGame();
    const yasuo = putOnBase(game, "ogn-76", "0", { exhausted: false });
    const enemy = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, yasuo.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(yasuo.cardId), yasuo);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });

  it("does nothing without an enemy unit here", () => {
    const game = makeGame();
    const yasuo = putOnBase(game, "ogn-76", "0", { exhausted: false });
    moveToBattlefield(game, yasuo.instanceId, 0);

    expect(() => SpecialCaseEngine.onAttack(game, getCard(yasuo.cardId), yasuo)).not.toThrow();
  });
});

describe("Leona, Zealot (ogn-79): conditional ready + Might debuff on stunned enemies here", () => {
  it("enters ready when the opponent is within 3 of the Victory Score", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-79"];
    game.players["1"].points = 5; // 8 - 3
    game.players["0"].runePool = [
      { instanceId: "power", domain: "Calm" as const, exhausted: false },
      ...Array.from({ length: getCard("ogn-79").energyCost! }, (_, i) => ({
        instanceId: `r${i}`,
        domain: "Calm" as const,
        exhausted: false,
      })),
    ];

    playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
    });

    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "ogn-79");
    expect(game.instances[newInstanceId!].exhausted).toBe(false);
  });

  it("gives a stunned enemy at the same battlefield -8 Might", () => {
    const game = makeGame();
    const leona = putOnBase(game, "ogn-79", "0");
    const enemy = putOnBase(game, "unit-vanguard-striker", "1");
    enemy.statuses.stunned = true;
    moveToBattlefield(game, leona.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);

    expect(computeMight(game, getCard, enemy, "none")).toBe(0); // floored at 0, not the card's stated 1
  });

  it("does not debuff a non-stunned enemy", () => {
    const game = makeGame();
    const leona = putOnBase(game, "ogn-79", "0");
    const enemy = putOnBase(game, "unit-vanguard-striker", "1");
    moveToBattlefield(game, leona.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);

    expect(computeMight(game, getCard, enemy, "none")).toBe(getCard("unit-vanguard-striker").might);
  });
});

describe("Eager Apprentice (ogn-84): spells you play cost 1 less while I'm at a battlefield", () => {
  it("reduces a spell's cost while at a battlefield", () => {
    const game = makeGame();
    const apprentice = putOnBase(game, "ogn-84", "0");
    moveToBattlefield(game, apprentice.instanceId, 0);
    game.players["0"].hand = ["ogn-5"]; // Disintegrate, Energy 4
    const target = putOnBase(game, "unit-plain-guard", "1");
    game.players["0"].runePool = Array.from({ length: 3 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
  });

  it("does not reduce cost while on base", () => {
    const game = makeGame();
    putOnBase(game, "ogn-84", "0"); // stays on base, not at a battlefield
    game.players["0"].hand = ["ogn-5"];
    const target = putOnBase(game, "unit-plain-guard", "1");
    game.players["0"].runePool = Array.from({ length: 3 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Garbage Grabber (ogn-99): recycle 3 from trash, 1 Energy, Exhaust: Draw 1", () => {
  it("recycles 3 cards from trash and draws", () => {
    const game = makeGame();
    const grabber = putOnBase(game, "ogn-99", "0", { exhausted: false });
    game.players["0"].trash = ["ogn-4", "ogn-5", "ogn-8", "ogn-11"];
    game.players["0"].mainDeck = ["ogn-14"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];

    const result = activateAbility(ctx(game, "0"), {
      instanceId: grabber.instanceId,
      energyRuneIds: ["r1"],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].trash).toEqual(["ogn-11"]);
    expect(game.players["0"].mainDeck).toEqual(["ogn-4", "ogn-5", "ogn-8"]);
    expect(game.players["0"].hand).toContain("ogn-14");
  });

  it("fails without enough cards in trash", () => {
    const game = makeGame();
    const grabber = putOnBase(game, "ogn-99", "0", { exhausted: false });
    game.players["0"].trash = ["ogn-4"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];

    const result = activateAbility(ctx(game, "0"), {
      instanceId: grabber.instanceId,
      energyRuneIds: ["r1"],
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Gemcraft Seer (ogn-100): other friendly units have Vision", () => {
  it("triggers Predict when another friendly unit is played", () => {
    const game = makeGame();
    putOnBase(game, "ogn-100", "0");
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["r1"], powerRuneIds: [] });

    expect(game.players["0"].pendingPredict).toBe(true);
  });

  it("does not trigger for a spell", () => {
    const game = makeGame();
    putOnBase(game, "ogn-100", "0");
    game.players["0"].hand = ["ogn-8"]; // Get Excited!
    const target = putOnBase(game, "unit-plain-guard", "1");
    game.players["0"].runePool = [
      { instanceId: "power", domain: "Fury" as const, exhausted: false },
      { instanceId: "r1", domain: "Fury" as const, exhausted: false },
    ];

    playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r1"],
      powerRuneIds: ["power"],
      targetInstanceId: target.instanceId,
    });

    expect(game.players["0"].pendingPredict).toBe(false);
  });
});

describe("Portal Rescue (ogn-102): banish a friendly unit, play it to base ignoring cost", () => {
  it("moves the unit from base through banishment and back to base as a new instance", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-102", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["0"].banishment).toContain("unit-plain-footman");
    const newInstanceId = game.players["0"].base.find(
      (id) => id !== spell.instanceId && game.instances[id].cardId === "unit-plain-footman",
    );
    expect(newInstanceId).toBeDefined();
  });

  it("ignores an enemy unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-102", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, enemy.instanceId);

    expect(game.instances[enemy.instanceId]).toBeDefined();
  });
});

describe("Retreat (ogn-104): return a friendly unit to hand, owner channels 1 exhausted", () => {
  it("returns the unit to hand and channels a rune exhausted", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-104", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].runeDeck = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("unit-plain-footman");
    expect(game.players["0"].runePool).toEqual([{ instanceId: "r1", domain: "Fury", exhausted: true }]);
  });
});

describe("Singularity (ogn-105): deal 6 to each of up to two units (simplified to one)", () => {
  it("deals 6 damage to the chosen target", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-105", "0");
    const target = putOnBase(game, "unit-vanguard-striker", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });
});

describe("Sprite Mother (ogn-106): play a ready 3 Might Sprite token with Temporary here", () => {
  it("creates a ready 3 Might Temporary token on base when played there", () => {
    const game = makeGame();
    const mother = putOnBase(game, "ogn-106", "0");

    SpecialCaseEngine.onPlay(game, getCard(mother.cardId), mother);

    const tokenId = game.players["0"].base.find(
      (id) => id !== mother.instanceId && game.instances[id].cardId === "token-sprite-temporary",
    );
    expect(tokenId).toBeDefined();
    const token = game.instances[tokenId!];
    expect(token.exhausted).toBe(false);
    expect(token.statuses.temporary).toBe(true);
    expect(computeMight(game, getCard, token, "none")).toBe(3);
  });

  it("creates the token at the same battlefield when played there", () => {
    const game = makeGame();
    const mother = putOnBase(game, "ogn-106", "0");
    moveToBattlefield(game, mother.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(mother.cardId), mother);

    const tokenId = game.battlefields[0].units["0"].find((id) => game.instances[id].cardId === "token-sprite-temporary");
    expect(tokenId).toBeDefined();
  });
});

describe("Dr. Mundo, Expert (ogn-109): Might scales with trash size, recycle 3 at Beginning", () => {
  it("adds trash count to Might", () => {
    const game = makeGame();
    const mundo = putOnBase(game, "ogn-109", "0");
    const baseline = getCard("ogn-109").might!;
    game.players["0"].trash = ["ogn-4", "ogn-5", "ogn-8"];

    expect(computeMight(game, getCard, mundo, "none")).toBe(baseline + 3);
  });

  it("recycles 3 from trash at Beginning", () => {
    const game = makeGame();
    putOnBase(game, "ogn-109", "0");
    game.players["0"].trash = ["ogn-4", "ogn-5", "ogn-8", "ogn-11"];
    game.players["0"].mainDeck = [];

    runBeginning(game, "0");

    expect(game.players["0"].trash).toEqual(["ogn-11"]);
    expect(game.players["0"].mainDeck).toEqual(["ogn-4", "ogn-5", "ogn-8"]);
  });
});

describe("Wraith of Echoes (ogn-118): first friendly unit death each turn draws 1", () => {
  it("draws once when a friendly unit dies, not again the same turn", () => {
    const game = makeGame();
    const wraith = putOnBase(game, "ogn-118", "0");
    const unit1 = putOnBase(game, "unit-plain-footman", "0");
    const unit2 = putOnBase(game, "unit-plain-guard", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];

    destroyInstance(game, getCard, unit1.instanceId);
    expect(game.players["0"].hand).toEqual(["ogn-4"]);

    destroyInstance(game, getCard, unit2.instanceId);
    expect(game.players["0"].hand).toEqual(["ogn-4"]); // no second draw this turn

    void wraith;
  });

  it("resets its once-per-turn gate at Awaken", () => {
    const game = makeGame();
    const wraith = putOnBase(game, "ogn-118", "0");
    const unit1 = putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    destroyInstance(game, getCard, unit1.instanceId);
    expect(wraith.statuses.wraithDrewThisTurn).toBe(true);

    runTurnStart(game, "0");

    expect(wraith.statuses.wraithDrewThisTurn).toBeUndefined();
  });
});

describe("Viktor, Innovator (ogn-117): play a card on opponent's turn (no-op by construction)", () => {
  it("has no handler behavior to invoke", () => {
    const game = makeGame();
    const viktor = putOnBase(game, "ogn-117", "0");
    expect(() => SpecialCaseEngine.onPlay(game, getCard(viktor.cardId), viktor)).not.toThrow();
  });
});

describe("Thousand-Tailed Watcher (ogn-116): give enemy units -3 Might this turn on play", () => {
  it("debuffs enemy units but not friendly ones", () => {
    const game = makeGame();
    const watcher = putOnBase(game, "ogn-116", "0");
    const enemy = putOnBase(game, "unit-vanguard-striker", "1");
    const ally = putOnBase(game, "unit-vanguard-striker", "0");
    const enemyBaseline = computeMight(game, getCard, enemy, "none");
    const allyBaseline = computeMight(game, getCard, ally, "none");

    SpecialCaseEngine.onPlay(game, getCard(watcher.cardId), watcher);

    expect(computeMight(game, getCard, enemy, "none")).toBe(Math.max(0, enemyBaseline - 3));
    expect(computeMight(game, getCard, ally, "none")).toBe(allyBaseline);
  });
});

describe("Time Warp (ogn-122): take a turn after this one, banish this", () => {
  it("sets extraTurnFor and banishes itself via playCard", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-122"];
    const card = getCard("ogn-122");
    game.players["0"].runePool = [
      { instanceId: "p1", domain: "Mind" as const, exhausted: false },
      { instanceId: "p2", domain: "Mind" as const, exhausted: false },
      { instanceId: "p3", domain: "Mind" as const, exhausted: false },
      { instanceId: "p4", domain: "Mind" as const, exhausted: false },
      ...Array.from({ length: card.energyCost! }, (_, i) => ({
        instanceId: `r${i}`,
        domain: "Mind" as const,
        exhausted: false,
      })),
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: Array.from({ length: card.energyCost! }, (_, i) => `r${i}`),
      powerRuneIds: ["p1", "p2", "p3", "p4"],
    });

    expect(result).toBeUndefined();
    expect(game.extraTurnFor).toBe("0");
    expect(game.players["0"].banishment).toContain("ogn-122");
    expect(game.players["0"].trash).not.toContain("ogn-122");
  });
});

describe("Unchecked Power (ogn-123): exhaust friendly units, deal 12 to all battlefield units", () => {
  it("exhausts friendly units and kills everything at battlefields", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-123", "0");
    const myUnit = putOnBase(game, "unit-plain-footman", "0", { exhausted: false });
    const enemyUnit = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, myUnit.instanceId, 0);
    moveToBattlefield(game, enemyUnit.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.instances[myUnit.instanceId]).toBeUndefined();
    expect(game.instances[enemyUnit.instanceId]).toBeUndefined();
  });

  it("leaves units on base untouched by the damage but exhausts them", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-123", "0");
    const baseUnit = putOnBase(game, "unit-plain-footman", "0", { exhausted: false });

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.instances[baseUnit.instanceId]).toBeDefined();
    expect(baseUnit.exhausted).toBe(true);
  });
});

describe("Arena Bar (ogn-124): Exhaust: Buff an exhausted friendly unit", () => {
  it("buffs an exhausted friendly unit", () => {
    const game = makeGame();
    const bar = putOnBase(game, "ogn-124", "0", { exhausted: false });
    const target = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });

    const result = activateAbility(ctx(game, "0"), {
      instanceId: bar.instanceId,
      energyRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(target.statuses.buffed).toBe(true);
  });

  it("does not buff a ready unit", () => {
    const game = makeGame();
    const bar = putOnBase(game, "ogn-124", "0", { exhausted: false });
    const target = putOnBase(game, "unit-plain-footman", "0", { exhausted: false });

    activateAbility(ctx(game, "0"), {
      instanceId: bar.instanceId,
      energyRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(target.statuses.buffed).toBeUndefined();
  });
});

describe("Bilgewater Bully (ogn-125): Ganking while buffed", () => {
  it("allows battlefield-to-battlefield movement only while buffed", () => {
    const game = makeGame();
    const bully = putOnBase(game, "ogn-125", "0", { exhausted: false });
    bully.statuses.buffed = true;
    moveToBattlefield(game, bully.instanceId, 0);

    const result = attackBattlefield(ctx(game, "0"), { battlefieldIndex: 1, unitInstanceIds: [bully.instanceId] });

    expect(result).toBeUndefined();
    expect(game.instances[bully.instanceId].battlefieldIndex).toBe(1);
  });

  it("blocks the move when not buffed", () => {
    const game = makeGame();
    const bully = putOnBase(game, "ogn-125", "0", { exhausted: false });
    moveToBattlefield(game, bully.instanceId, 0);

    const result = attackBattlefield(ctx(game, "0"), { battlefieldIndex: 1, unitInstanceIds: [bully.instanceId] });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Confront (ogn-129): units you play this turn enter ready, draw 1", () => {
  it("makes every unit played this turn enter ready", () => {
    const game = makeGame();
    const confront = putOnBase(game, "ogn-129", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(confront.cardId), confront);
    expect(game.players["0"].unitsEnterReadyThisTurn).toBe(true);
    expect(game.players["0"].hand).toContain("ogn-4");

    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["r1"], powerRuneIds: [] });

    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "unit-plain-footman");
    expect(game.instances[newInstanceId!].exhausted).toBe(false);
  });
});

describe("Dune Drake (ogn-131): +2 Might on attack if a ready enemy unit is here", () => {
  it("gets the bonus against a ready enemy", () => {
    const game = makeGame();
    const drake = putOnBase(game, "ogn-131", "0", { exhausted: false });
    const enemy = putOnBase(game, "unit-plain-guard", "1", { exhausted: false });
    moveToBattlefield(game, drake.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(drake.cardId), drake);

    expect(drake.tempMightBonus).toBe(2);
  });

  it("gets no bonus against an exhausted enemy", () => {
    const game = makeGame();
    const drake = putOnBase(game, "ogn-131", "0", { exhausted: false });
    const enemy = putOnBase(game, "unit-plain-guard", "1", { exhausted: true });
    moveToBattlefield(game, drake.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(drake.cardId), drake);

    expect(drake.tempMightBonus).toBe(0);
  });
});

describe("First Mate (ogn-132): when you play me, ready another unit", () => {
  it("readies the chosen unit", () => {
    const game = makeGame();
    const mate = putOnBase(game, "ogn-132", "0");
    const target = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });

    SpecialCaseEngine.onPlay(game, getCard(mate.cardId), mate, target.instanceId);

    expect(target.exhausted).toBe(false);
  });
});

describe("Flurry of Blades (ogn-133): deal 1 to all units at battlefields", () => {
  it("kills a 1-Might unit at a battlefield, leaves base units alone", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-133", "0");
    const atBattlefield = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    const onBase = putOnBase(game, "unit-plain-guard", "0");
    moveToBattlefield(game, atBattlefield.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.instances[atBattlefield.instanceId]).toBeUndefined();
    expect(game.instances[onBase.instanceId]).toBeDefined();
  });
});

describe("Mobilize (ogn-134): channel 1 rune exhausted, else draw 1", () => {
  it("channels a rune exhausted when the rune deck has one", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-134", "0");
    game.players["0"].runeDeck = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].runePool).toEqual([{ instanceId: "r1", domain: "Fury", exhausted: true }]);
    expect(game.players["0"].hand).toEqual([]);
  });

  it("draws instead when the rune deck is empty", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-134", "0");
    game.players["0"].runeDeck = [];
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Pit Rookie (ogn-136): when you play me, buff another friendly unit", () => {
  it("buffs the chosen ally", () => {
    const game = makeGame();
    const rookie = putOnBase(game, "ogn-136", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onPlay(game, getCard(rookie.cardId), rookie, ally.instanceId);

    expect(ally.statuses.buffed).toBe(true);
  });
});

describe("Catalyst of Aeons (ogn-138): channel 2 exhausted, else draw 1", () => {
  it("channels 2 exhausted runes when available", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-138", "0");
    game.players["0"].runeDeck = [
      { instanceId: "r1", domain: "Fury", exhausted: false },
      { instanceId: "r2", domain: "Fury", exhausted: false },
    ];
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].runePool.length).toBe(2);
    expect(game.players["0"].hand).toEqual([]);
  });

  it("draws 1 when fewer than 2 runes could be channeled", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-138", "0");
    game.players["0"].runeDeck = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].runePool.length).toBe(1);
    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Cithria of Cloudfield (ogn-139): when you play another unit, buff me", () => {
  it("buffs itself when another unit is played", () => {
    const game = makeGame();
    const cithria = putOnBase(game, "ogn-139", "0");
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];

    playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["r1"], powerRuneIds: [] });

    expect(cithria.statuses.buffed).toBe(true);
  });
});

describe("Kinkou Monk (ogn-141): buff up to two other friendly units (simplified to one)", () => {
  it("buffs the single chosen ally", () => {
    const game = makeGame();
    const monk = putOnBase(game, "ogn-141", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onPlay(game, getCard(monk.cardId), monk, ally.instanceId);

    expect(ally.statuses.buffed).toBe(true);
  });
});

describe("Spoils of War (ogn-144): cost reduced if an enemy unit died this turn, draw 2", () => {
  it("draws 2 always, costs less only after an enemy death", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-144", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].hand).toEqual(["ogn-4", "ogn-5"]);
  });

  it("reduces cost by 2 after an enemy unit died this turn", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-144"];
    const card = getCard("ogn-144");
    game.players["0"].enemyUnitDiedThisTurn = true;
    game.players["0"].runePool = [
      { instanceId: "power", domain: "Body" as const, exhausted: false },
      ...Array.from({ length: card.energyCost! - 2 }, (_, i) => ({
        instanceId: `r${i}`,
        domain: "Body" as const,
        exhausted: false,
      })),
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
    });

    expect(result).toBeUndefined();
  });
});

describe("Carnivorous Snapvine (ogn-149): trade Might damage with a chosen enemy unit", () => {
  it("kills a weaker enemy unit while surviving itself", () => {
    const game = makeGame();
    const snapvine = putOnBase(game, "ogn-149", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(snapvine.cardId), snapvine, enemy.instanceId);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
    expect(game.instances[snapvine.instanceId]).toBeDefined();
  });

  it("ignores a friendly unit and a unit not at a battlefield", () => {
    const game = makeGame();
    const snapvine = putOnBase(game, "ogn-149", "0");
    const notAtBattlefield = putOnBase(game, "unit-plain-guard", "1");

    SpecialCaseEngine.onPlay(game, getCard(snapvine.cardId), snapvine, notAtBattlefield.instanceId);

    expect(game.instances[notAtBattlefield.instanceId]).toBeDefined();
  });
});

describe("Lee Sin, Centered (ogn-151): other buffed friendly units at my battlefield have +2 Might", () => {
  it("buffs a buffed ally at the same battlefield", () => {
    const game = makeGame();
    const leeSin = putOnBase(game, "ogn-151", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    ally.statuses.buffed = true;
    moveToBattlefield(game, leeSin.instanceId, 0);
    moveToBattlefield(game, ally.instanceId, 0);

    expect(computeMight(game, getCard, ally, "none")).toBe(getCard("unit-plain-footman").might! + 1 + 2); // +1 buff, +2 Lee Sin
  });

  it("does not buff a non-buffed ally", () => {
    const game = makeGame();
    const leeSin = putOnBase(game, "ogn-151", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, leeSin.instanceId, 0);
    moveToBattlefield(game, ally.instanceId, 0);

    expect(computeMight(game, getCard, ally, "none")).toBe(getCard("unit-plain-footman").might);
  });
});

describe("Sabotage (ogn-156): reveal opponent's hand, recycle a non-unit card", () => {
  it("recycles the first non-unit card found", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-156", "0");
    game.players["1"].hand = ["unit-plain-footman", "ogn-8", "unit-plain-guard"]; // ogn-8 is a spell

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["1"].hand).toEqual(["unit-plain-footman", "unit-plain-guard"]);
    expect(game.players["1"].mainDeck).toContain("ogn-8");
  });

  it("does nothing if the opponent's hand is all units", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-156", "0");
    game.players["1"].hand = ["unit-plain-footman"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["1"].hand).toEqual(["unit-plain-footman"]);
  });
});

describe("Qiyana, Victorious (ogn-155): on conquer, draw 1 or channel 1 (simplified to draw)", () => {
  it("draws a card on conquer", () => {
    const game = makeGame();
    const qiyana = putOnBase(game, "ogn-155", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onConquer(game, getCard(qiyana.cardId), qiyana, 0);

    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Herald of Scales (ogn-140): Dragons you play cost 2 less", () => {
  it("reduces the cost of a Dragon-tagged card", () => {
    const game = makeGame();
    const herald = putOnBase(game, "ogn-140", "0");
    game.players["0"].hand = ["ogn-38"]; // Kadregrin the Infernal, Dragon tag, Energy 9
    const card = getCard("ogn-38");
    game.players["0"].runePool = [
      { instanceId: "p1", domain: "Fury" as const, exhausted: false },
      { instanceId: "p2", domain: "Fury" as const, exhausted: false },
      ...Array.from({ length: card.energyCost! - 2 }, (_, i) => ({
        instanceId: `r${i}`,
        domain: "Fury" as const,
        exhausted: false,
      })),
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: Array.from({ length: card.energyCost! - 2 }, (_, i) => `r${i}`),
      powerRuneIds: ["p1", "p2"],
    });

    expect(result).toBeUndefined();
    void herald;
  });
});

describe("Warwick, Hunter (ogn-159): enters ready, kills damaged enemies on attack", () => {
  it("enters ready when played", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-159"];
    const card = getCard("ogn-159");
    game.players["0"].runePool = [
      { instanceId: "power", domain: "Body" as const, exhausted: false },
      ...Array.from({ length: card.energyCost! }, (_, i) => ({
        instanceId: `r${i}`,
        domain: "Body" as const,
        exhausted: false,
      })),
    ];

    playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.filter((r) => r.instanceId !== "power").map((r) => r.instanceId),
      powerRuneIds: ["power"],
    });

    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "ogn-159");
    expect(newInstanceId).toBeDefined();
    expect(game.instances[newInstanceId!].exhausted).toBe(false);
  });

  it("kills damaged enemy units at the battlefield on attack, leaves undamaged ones", () => {
    const game = makeGame();
    const warwick = putOnBase(game, "ogn-159", "0", { exhausted: false });
    const damagedEnemy = putOnBase(game, "unit-vanguard-striker", "1");
    const healthyEnemy = putOnBase(game, "unit-vanguard-striker", "1");
    damagedEnemy.damage = 1;
    moveToBattlefield(game, warwick.instanceId, 0);
    moveToBattlefield(game, damagedEnemy.instanceId, 0);
    moveToBattlefield(game, healthyEnemy.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(warwick.cardId), warwick);

    expect(game.instances[damagedEnemy.instanceId]).toBeUndefined();
    expect(game.instances[healthyEnemy.instanceId]).toBeDefined();
  });
});

describe("Sett, Brawler (ogn-164): buff on play/conquer, spend buff for +4 Might this turn", () => {
  it("buffs on play and on conquer", () => {
    const game = makeGame();
    const sett = putOnBase(game, "ogn-164", "0");
    SpecialCaseEngine.onPlay(game, getCard(sett.cardId), sett);
    expect(sett.statuses.buffed).toBe(true);

    sett.statuses.buffed = false;
    SpecialCaseEngine.onConquer(game, getCard(sett.cardId), sett, 0);
    expect(sett.statuses.buffed).toBe(true);
  });

  it("spends the buff to gain +4 Might this turn", () => {
    const game = makeGame();
    const sett = putOnBase(game, "ogn-164", "0", { exhausted: false });
    sett.statuses.buffed = true;

    const result = activateAbility(ctx(game, "0"), { instanceId: sett.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(sett.statuses.buffed).toBe(false);
    expect(sett.tempMightBonus).toBe(4);
  });

  it("fails to activate without a buff", () => {
    const game = makeGame();
    const sett = putOnBase(game, "ogn-164", "0", { exhausted: false });

    const result = activateAbility(ctx(game, "0"), { instanceId: sett.instanceId, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Cemetery Attendant (ogn-165) / Morbid Return (ogn-170): return a unit from trash to hand", () => {
  it("Cemetery Attendant returns the first unit found in trash", () => {
    const game = makeGame();
    const attendant = putOnBase(game, "ogn-165", "0");
    game.players["0"].trash = ["ogn-8", "unit-plain-footman", "unit-plain-guard"]; // ogn-8 is a spell

    SpecialCaseEngine.onPlay(game, getCard(attendant.cardId), attendant);

    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
    expect(game.players["0"].trash).toEqual(["ogn-8", "unit-plain-guard"]);
  });

  it("Morbid Return does the same as a spell", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-170", "0");
    game.players["0"].trash = ["unit-plain-guard"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].hand).toContain("unit-plain-guard");
  });
});

describe("Gust (ogn-169): return a unit at a battlefield with 3 Might or less to hand", () => {
  it("returns a weak unit at a battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-169", "0");
    const target = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, target.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toContain("unit-plain-guard");
  });

  it("does not affect a unit on base (not at a battlefield)", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-169", "0");
    const target = putOnBase(game, "unit-plain-guard", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Acceptable Losses (ogn-179): each player kills one of their gear", () => {
  it("kills a gear for each player that has one", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-179", "0");
    const myGear = putOnBase(game, "gear-tactical-banner", "0");
    const theirGear = putOnBase(game, "gear-tactical-banner", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.instances[myGear.instanceId]).toBeUndefined();
    expect(game.instances[theirGear.instanceId]).toBeUndefined();
  });
});

describe("Fading Memories (ogn-180): give a unit at a battlefield or a gear Temporary", () => {
  it("gives Temporary to a unit at a battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-180", "0");
    const target = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, target.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.statuses.temporary).toBe(true);
  });

  it("gives Temporary to a gear regardless of zone", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-180", "0");
    const gear = putOnBase(game, "gear-tactical-banner", "0");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, gear.instanceId);

    expect(gear.statuses.temporary).toBe(true);
  });

  it("ignores a unit on base", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-180", "0");
    const target = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.statuses.temporary).toBeUndefined();
  });
});

describe("Undercover Agent (ogn-178): Deathknell — discard 2, then draw 2", () => {
  it("discards 2 and draws 2 on destroy", () => {
    const game = makeGame();
    const agent = putOnBase(game, "ogn-178", "0");
    game.players["0"].hand = ["ogn-4", "ogn-5"];
    game.players["0"].mainDeck = ["ogn-8", "ogn-11"];

    destroyInstance(game, getCard, agent.instanceId);

    expect(game.players["0"].hand).toEqual(["ogn-8", "ogn-11"]);
    expect(game.players["0"].trash).toContain("ogn-4");
    expect(game.players["0"].trash).toContain("ogn-5");
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
