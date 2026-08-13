import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { playCard, activateAbility, attackBattlefield, resolveOptionalCost } from "../src/game/moves";
import { destroyInstance } from "../src/game/combat";
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
