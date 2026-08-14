import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { destroyInstance, resolveCombat } from "../src/game/combat";
import { runBeginning, runAwaken } from "../src/game/turnFlow";
import { activateAbility, playCard } from "../src/game/moves";
import { playTokenToBase } from "../src/cards/special-cases/token-helpers";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof activateAbility>[0];
}

function moveToBattlefield(game: ReturnType<typeof makeGame>, instanceId: string, battlefieldIndex: number) {
  const instance = game.instances[instanceId];
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  game.battlefields[battlefieldIndex].units[instance.controller].push(instanceId);
}

describe("Arena Kingpin (unl-1): enters ready; Exhaust: give a unit +3 Might", () => {
  it("enters ready and can activate to buff a target", () => {
    const game = makeGame();
    const kingpin = putOnBase(game, "unl-1", "0", { exhausted: true });
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(kingpin.cardId), kingpin)).toBe(true);

    const target = putOnBase(game, "unit-plain-footman", "0");
    SpecialCaseEngine.onActivate(game, getCard(kingpin.cardId), kingpin, target.instanceId);
    expect(target.tempMightBonus).toBe(3);
  });
});

describe("Smite (unl-7): deal 3, banish instead of trash if lethal", () => {
  it("banishes a unit that would die", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-7", "0");
    const target = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, target.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["1"].banishment).toContain("unit-plain-guard");
    expect(game.players["1"].trash).not.toContain("unit-plain-guard");
  });

  it("deals normal spell damage without banishing if it survives", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-7", "0");
    const target = putOnBase(game, "unit-plain-footman", "1"); // Might 2
    target.tempMightBonus = 8; // Might 10, survives 3 damage
    moveToBattlefield(game, target.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
    expect(target.damage).toBe(3);
  });
});

describe("Vault Breaker (unl-10): give a unit Assault 2 and Ganking this turn", () => {
  it("grants both keywords via grantedThisTurn", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-10", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.grantedThisTurn).toContainEqual({ keyword: "assault", value: 2 });
    expect(target.grantedThisTurn).toContainEqual({ keyword: "ganking" });
  });
});

describe("Right of Conquest (unl-15): draw 1 plus 1 per controlled battlefield", () => {
  it("draws 1 with no battlefields controlled", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-15", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].hand).toEqual(["ogn-4"]);
  });

  it("draws extra per controlled battlefield", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    const spell = putOnBase(game, "unl-15", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.players["0"].hand).toEqual(["ogn-4", "ogn-5"]);
  });
});

describe("Scorchclaw (unl-16): +1 Might and enters ready at 3+ XP", () => {
  it("grants the bonus only at the threshold", () => {
    const game = makeGame();
    const scorchclaw = putOnBase(game, "unl-16", "0");
    const baseline = getCard(scorchclaw.cardId).might!;
    expect(computeMight(game, getCard, scorchclaw, "none")).toBe(baseline);
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(scorchclaw.cardId), scorchclaw)).toBe(false);

    game.players["0"].xp = 3;
    expect(computeMight(game, getCard, scorchclaw, "none")).toBe(baseline + 1);
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(scorchclaw.cardId), scorchclaw)).toBe(true);
  });
});

describe("Gustwalker (unl-75): +1 Might and Ganking at 3+ XP", () => {
  it("grants Ganking only at the threshold", () => {
    const game = makeGame();
    const gustwalker = putOnBase(game, "unl-75", "0");
    expect(SpecialCaseEngine.hasConditionalGanking(game, getCard(gustwalker.cardId), gustwalker)).toBe(false);

    game.players["0"].xp = 3;
    expect(SpecialCaseEngine.hasConditionalGanking(game, getCard(gustwalker.cardId), gustwalker)).toBe(true);
  });
});

describe("Gemhand Hunter (unl-94): +1 Might at 6+ XP", () => {
  it("grants the bonus only at the threshold", () => {
    const game = makeGame();
    const hunter = putOnBase(game, "unl-94", "0");
    const baseline = getCard(hunter.cardId).might!;
    game.players["0"].xp = 6;
    expect(computeMight(game, getCard, hunter, "none")).toBe(baseline + 1);
  });
});

describe("Targonian Visionary (unl-98): +4 Might at 11+ XP", () => {
  it("grants the bonus only at the threshold", () => {
    const game = makeGame();
    const visionary = putOnBase(game, "unl-98", "0");
    const baseline = getCard(visionary.cardId).might!;
    game.players["0"].xp = 11;
    expect(computeMight(game, getCard, visionary, "none")).toBe(baseline + 4);
  });
});

describe("Bandle Soldier (unl-151): enters ready at 3+ XP", () => {
  it("checks the XP threshold", () => {
    const game = makeGame();
    const soldier = putOnBase(game, "unl-151", "0");
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(soldier.cardId), soldier)).toBe(false);
    game.players["0"].xp = 3;
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(soldier.cardId), soldier)).toBe(true);
  });
});

describe("Master Yi, Unstoppable (unl-59): tiered Energy cost reduction by XP", () => {
  it("scales the reduction at each tier", () => {
    const game = makeGame();
    const yi = putOnBase(game, "unl-59", "0");
    const card = getCard(yi.cardId);
    expect(SpecialCaseEngine.costReduction(game, card, yi)).toBe(0);
    game.players["0"].xp = 3;
    expect(SpecialCaseEngine.costReduction(game, card, yi)).toBe(2);
    game.players["0"].xp = 6;
    expect(SpecialCaseEngine.costReduction(game, card, yi)).toBe(4);
    game.players["0"].xp = 11;
    expect(SpecialCaseEngine.costReduction(game, card, yi)).toBe(6);
  });
});

describe("Concentrate (unl-91): draw 2, tiered cost reduction by XP", () => {
  it("draws 2 cards", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-91", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);
    expect(game.players["0"].hand).toEqual(["ogn-4", "ogn-5"]);
  });

  it("scales the reduction at each tier", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-91", "0");
    const card = getCard(spell.cardId);
    expect(SpecialCaseEngine.costReduction(game, card, spell)).toBe(0);
    game.players["0"].xp = 6;
    expect(SpecialCaseEngine.costReduction(game, card, spell)).toBe(2);
    game.players["0"].xp = 11;
    expect(SpecialCaseEngine.costReduction(game, card, spell)).toBe(4);
  });
});

describe("Mosstomper (unl-47): +1 Might at 3+ XP (Deflect grant not modeled)", () => {
  it("grants the Might bonus at the threshold", () => {
    const game = makeGame();
    const mosstomper = putOnBase(game, "unl-47", "0");
    const baseline = getCard(mosstomper.cardId).might!;
    game.players["0"].xp = 3;
    expect(computeMight(game, getCard, mosstomper, "none")).toBe(baseline + 1);
  });
});

describe("Master Yi, Tempered (unl-113): Ganking at 6+ XP (Deflect grant not modeled)", () => {
  it("grants Ganking at the threshold", () => {
    const game = makeGame();
    const yi = putOnBase(game, "unl-113", "0");
    expect(SpecialCaseEngine.hasConditionalGanking(game, getCard(yi.cardId), yi)).toBe(false);
    game.players["0"].xp = 6;
    expect(SpecialCaseEngine.hasConditionalGanking(game, getCard(yi.cardId), yi)).toBe(true);
  });
});

describe("Sprite Burst (unl-69): play two ready Sprite tokens", () => {
  it("plays two ready 3-Might Sprite tokens", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-69", "0");
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);
    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-sprite-temporary");
    expect(tokens).toHaveLength(2);
    expect(tokens.every((id) => !game.instances[id].exhausted)).toBe(true);
  });
});

describe("Turn to Dust (unl-70): give a gear Temporary", () => {
  it("sets the temporary status on the target gear", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-70", "0");
    const gear = putOnBase(game, "gear-tactical-banner", "0");
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, gear.instanceId);
    expect(gear.statuses.temporary).toBe(true);
  });
});

describe("Sprite Queen (unl-84): summons a Sprite on play and each Beginning Phase", () => {
  it("summons on play and clears the mistakenly-set Temporary status on herself", () => {
    const game = makeGame();
    const queen = putOnBase(game, "unl-84", "0");
    expect(queen.statuses.temporary).toBe(true); // data quirk: wrongly set by createInstance
    SpecialCaseEngine.onPlay(game, getCard(queen.cardId), queen);
    expect(queen.statuses.temporary).toBe(false);
    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-sprite-temporary");
    expect(tokens).toHaveLength(1);
  });

  it("summons again at the start of the Beginning Phase", () => {
    const game = makeGame();
    const queen = putOnBase(game, "unl-84", "0");
    // putOnBase bypasses onPlay, which is where the (data-quirk) wrongly-set
    // statuses.temporary normally gets cleared — simulate that here.
    queen.statuses.temporary = false;
    runBeginning(game, "0");
    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-sprite-temporary");
    expect(tokens).toHaveLength(1);
  });
});

describe("Soul Harvest (unl-159): kill a unit at a battlefield with 3 Might or less", () => {
  it("kills an eligible target", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-159", "0");
    const target = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, target.instanceId, 0);
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("does not kill a unit above the Might threshold", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-159", "0");
    const target = putOnBase(game, "unit-plain-footman", "1"); // Might 2
    target.tempMightBonus = 5;
    moveToBattlefield(game, target.instanceId, 0);
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Soul Shepherd (unl-77): your token units have +1 Might", () => {
  it("buffs token allies, not non-tokens", () => {
    const game = makeGame();
    putOnBase(game, "unl-77", "0");
    const token = putOnBase(game, "token-recruit", "0");
    expect(computeMight(game, getCard, token, "none")).toBe(getCard(token.cardId).might! + 1);

    const nonToken = putOnBase(game, "unit-plain-footman", "0");
    expect(computeMight(game, getCard, nonToken, "none")).toBe(getCard(nonToken.cardId).might!);
  });
});

describe("Vicious Snapjaws (unl-129): gain 1 XP when another friendly unit dies", () => {
  it("gains XP on an ally's death", () => {
    const game = makeGame();
    putOnBase(game, "unl-129", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    destroyInstance(game, getCard, ally.instanceId);
    expect(game.players["0"].xp).toBe(1);
  });
});

describe("Spectral Centaur (unl-68): +2 Might when another friendly unit dies", () => {
  it("buffs itself on an ally's death", () => {
    const game = makeGame();
    const centaur = putOnBase(game, "unl-68", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    destroyInstance(game, getCard, ally.instanceId);
    expect(centaur.tempMightBonus).toBe(2);
  });
});

describe("Black Rose Dignitary (unl-152): Deathknell channels 1 rune exhausted", () => {
  it("channels an exhausted rune on death", () => {
    const game = makeGame();
    const dignitary = putOnBase(game, "unl-152", "0");
    game.players["0"].runeDeck = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];
    destroyInstance(game, getCard, dignitary.instanceId);
    expect(game.players["0"].runePool).toEqual([{ instanceId: "r1", domain: "Fury", exhausted: true }]);
  });
});

describe("Carrion Dredger (unl-153): Deathknell plays a Bird token with Deflect", () => {
  it("plays the Bird token into base", () => {
    const game = makeGame();
    const dredger = putOnBase(game, "unl-153", "0");
    destroyInstance(game, getCard, dredger.instanceId);
    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-bird-deflect");
    expect(tokenId).toBeDefined();
  });
});

describe("Loyal Poro (unl-156): Deathknell draws 1 if it didn't die alone", () => {
  it("draws when accompanied by another friendly unit", () => {
    const game = makeGame();
    const poro = putOnBase(game, "unl-156", "0");
    putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    destroyInstance(game, getCard, poro.instanceId);
    expect(game.players["0"].hand).toContain("ogn-4");
  });

  it("does not draw when alone", () => {
    const game = makeGame();
    const poro = putOnBase(game, "unl-156", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    destroyInstance(game, getCard, poro.instanceId);
    expect(game.players["0"].hand).not.toContain("ogn-4");
  });
});

describe("Scrutinizing Sergeant (unl-157): gain 1 XP per friendly unit on play", () => {
  it("counts itself and other friendly units", () => {
    const game = makeGame();
    putOnBase(game, "unit-plain-footman", "0");
    const sergeant = putOnBase(game, "unl-157", "0");
    SpecialCaseEngine.onPlay(game, getCard(sergeant.cardId), sergeant);
    expect(game.players["0"].xp).toBe(2);
  });
});

describe("Starhound (unl-167): return a Bird/Cat/Dog/Poro from trash on play", () => {
  it("returns the first eligible tagged card", () => {
    const game = makeGame();
    const starhound = putOnBase(game, "unl-167", "0");
    game.players["0"].trash = ["token-bird-deflect", "unit-plain-guard"];
    SpecialCaseEngine.onPlay(game, getCard(starhound.cardId), starhound);
    expect(game.players["0"].hand).toContain("token-bird-deflect");
  });
});

describe("LeBlanc, Fragmented (unl-172): Deathknell draws 1 (2 during Beginning Phase)", () => {
  it("draws 1 outside the Beginning Phase", () => {
    const game = makeGame();
    const leblanc = putOnBase(game, "unl-172", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];
    game.turnPhase = "main";
    destroyInstance(game, getCard, leblanc.instanceId);
    expect(game.players["0"].hand).toEqual(["ogn-4"]);
  });

  it("draws 2 during the Beginning Phase", () => {
    const game = makeGame();
    const leblanc = putOnBase(game, "unl-172", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];
    game.turnPhase = "beginning";
    destroyInstance(game, getCard, leblanc.instanceId);
    expect(game.players["0"].hand).toEqual(["ogn-4", "ogn-5"]);
  });
});

describe("Frisky Hunter (unl-33): on play, play a Bird token with Deflect here", () => {
  it("plays the token at the same location", () => {
    const game = makeGame();
    const hunter = putOnBase(game, "unl-33", "0");
    SpecialCaseEngine.onPlay(game, getCard(hunter.cardId), hunter);
    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-bird-deflect");
    expect(tokenId).toBeDefined();
  });
});

describe("Fate Weaver (unl-64): look at top 4, take a 4+ Energy spell", () => {
  it("takes the first eligible spell and recycles the rest", () => {
    const game = makeGame();
    const weaver = putOnBase(game, "unl-64", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5", "unit-plain-guard", "ogn-11"]; // ogn-5 Disintegrate costs 4
    SpecialCaseEngine.onPlay(game, getCard(weaver.cardId), weaver);
    expect(game.players["0"].hand).toEqual(["ogn-5"]);
  });
});

describe("Ruined Rex (unl-67): Deathknell deals 4 to an enemy unit", () => {
  it("kills a weak enemy unit", () => {
    const game = makeGame();
    const rex = putOnBase(game, "unl-67", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    destroyInstance(game, getCard, rex.instanceId);
    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });
});

describe("Petal Pixie (unl-76): +1 Might per Temporary friendly unit at my battlefield", () => {
  it("counts only Temporary allies at the same location", () => {
    const game = makeGame();
    const pixie = putOnBase(game, "unl-76", "0");
    moveToBattlefield(game, pixie.instanceId, 0);
    const baseline = getCard(pixie.cardId).might!;
    expect(computeMight(game, getCard, pixie, "none")).toBe(baseline);

    const sprite = putOnBase(game, "token-sprite-temporary", "0");
    moveToBattlefield(game, sprite.instanceId, 0);
    expect(computeMight(game, getCard, pixie, "none")).toBe(baseline + 1);
  });
});

describe("Kinkou Initiate (unl-97): draw 1 if other units have total Might 5+", () => {
  it("draws when the threshold is met", () => {
    const game = makeGame();
    const initiate = putOnBase(game, "unl-97", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    ally.tempMightBonus = 3; // total 5
    game.players["0"].mainDeck = ["ogn-4"];
    SpecialCaseEngine.onPlay(game, getCard(initiate.cardId), initiate);
    expect(game.players["0"].hand).toContain("ogn-4");
  });

  it("does not draw below the threshold", () => {
    const game = makeGame();
    const initiate = putOnBase(game, "unl-97", "0");
    putOnBase(game, "unit-plain-guard", "0"); // Might 1
    game.players["0"].mainDeck = ["ogn-4"];
    SpecialCaseEngine.onPlay(game, getCard(initiate.cardId), initiate);
    expect(game.players["0"].hand).not.toContain("ogn-4");
  });
});

describe("Gentle Gemdragon (unl-104): ready up to 2 runes when it or another Dragon is played", () => {
  it("readies exhausted runes on its own play", () => {
    const game = makeGame();
    const dragon = putOnBase(game, "unl-104", "0");
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Fury" as const, exhausted: true },
      { instanceId: "r2", domain: "Mind" as const, exhausted: true },
      { instanceId: "r3", domain: "Body" as const, exhausted: true },
    ];
    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard(dragon.cardId), 1);
    const readyCount = game.players["0"].runePool.filter((r) => !r.exhausted).length;
    expect(readyCount).toBe(2);
  });
});

describe("Elder Dragon (unl-118): on play, deal 1 to an enemy at each battlefield", () => {
  it("hits an enemy unit at each battlefield with an enemy present", () => {
    const game = makeGame();
    const dragon = putOnBase(game, "unl-118", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, enemy.instanceId, 0);
    SpecialCaseEngine.onPlay(game, getCard(dragon.cardId), dragon);
    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });
});

describe("Bewitching Spirit (unl-121): on play, opponent discards 1", () => {
  it("discards the front of the opponent's hand", () => {
    const game = makeGame();
    const spirit = putOnBase(game, "unl-121", "0");
    game.players["1"].hand = ["ogn-4"];
    SpecialCaseEngine.onPlay(game, getCard(spirit.cardId), spirit);
    expect(game.players["1"].trash).toContain("ogn-4");
    expect(game.players["1"].hand).toEqual([]);
  });
});

describe("Walking Roost (unl-130): on play, opponent plays a Bird token with Deflect", () => {
  it("plays the token into the opponent's base", () => {
    const game = makeGame();
    const roost = putOnBase(game, "unl-130", "0");
    SpecialCaseEngine.onPlay(game, getCard(roost.cardId), roost);
    const tokenId = game.players["1"].base.find((id) => game.instances[id].cardId === "token-bird-deflect");
    expect(tokenId).toBeDefined();
  });
});

describe("Angler Beast (unl-132): return all units with 2 Might or less to hand", () => {
  it("returns weak units on both sides, leaves strong ones", () => {
    const game = makeGame();
    const beast = putOnBase(game, "unl-132", "0");
    const weak = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    const strong = putOnBase(game, "unit-plain-footman", "1"); // Might 2
    strong.tempMightBonus = 5; // Might 7, survives
    SpecialCaseEngine.onPlay(game, getCard(beast.cardId), beast);
    expect(game.instances[weak.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toContain("unit-plain-guard");
    expect(game.instances[strong.instanceId]).toBeDefined();
  });
});

describe("Crimson Pigeons (unl-154): +2 Might while attacking with another unit", () => {
  it("gets the bonus only when another friendly unit shares its battlefield", () => {
    const game = makeGame();
    const pigeons = putOnBase(game, "unl-154", "0");
    moveToBattlefield(game, pigeons.instanceId, 0);
    const baseline = getCard(pigeons.cardId).might!;
    expect(computeMight(game, getCard, pigeons, "attacking")).toBe(baseline);

    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);
    expect(computeMight(game, getCard, pigeons, "attacking")).toBe(baseline + 2);
  });
});

describe("Rift Herald (unl-179): on move, look-and-draw a unit; Deathknell plays one from hand free", () => {
  it("draws a revealed unit on move", () => {
    const game = makeGame();
    const herald = putOnBase(game, "unl-179", "0", { exhausted: false });
    game.players["0"].mainDeck = ["unit-plain-guard"];
    SpecialCaseEngine.onMove(game, getCard(herald.cardId), herald);
    expect(game.players["0"].hand).toContain("unit-plain-guard");
  });

  it("plays a unit from hand for free on Deathknell", () => {
    const game = makeGame();
    const herald = putOnBase(game, "unl-179", "0");
    game.players["0"].hand = ["unit-plain-guard"];
    destroyInstance(game, getCard, herald.instanceId);
    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "unit-plain-guard");
    expect(newInstanceId).toBeDefined();
  });
});

describe("Death from Below (unl-186): kill a unit at a battlefield", () => {
  it("kills the target", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-186", "0");
    const target = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, target.instanceId, 0);
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(game.instances[target.instanceId]).toBeUndefined();
  });
});

describe("Alpha Strike (unl-192): split a friendly unit's Might among enemies, gain XP per kill", () => {
  it("kills weak enemies and gains XP", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-192", "0");
    const source = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    const enemy1 = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, enemy1.instanceId, 0);
    const enemy2 = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, enemy2.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, source.instanceId);

    expect(game.instances[enemy1.instanceId]).toBeUndefined();
    expect(game.instances[enemy2.instanceId]).toBeUndefined();
    expect(game.players["0"].xp).toBe(2);
  });
});

describe("Keeper's Verdict (unl-204): put an enemy unit on the bottom of their deck", () => {
  it("removes the target and pushes it to the owner's Main Deck", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-204", "0");
    const target = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, target.instanceId, 0);
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["1"].mainDeck).toContain("unit-plain-guard");
  });
});

describe("Dusk Rose Lab (unl-209): may kill a unit here to draw 1, each Beginning Phase", () => {
  it("kills the first friendly unit here and draws 1", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-209", units: { "0": [], "1": [] }, controller: null };
    const unit = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, unit.instanceId, 0);
    game.players["0"].mainDeck = ["ogn-4"];

    runBeginning(game, "0");

    expect(game.instances[unit.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Frozen Fortress (unl-212): deal 1 to each unit here, every Beginning Phase", () => {
  it("hits units on both sides at this battlefield", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-212", units: { "0": [], "1": [] }, controller: null };
    const mine = putOnBase(game, "unit-plain-guard", "0"); // Might 1
    moveToBattlefield(game, mine.instanceId, 0);
    const theirs = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, theirs.instanceId, 0);

    runBeginning(game, "0");

    expect(game.instances[mine.instanceId]).toBeUndefined();
    expect(game.instances[theirs.instanceId]).toBeUndefined();
  });
});

describe("Trapping Grounds (unl-217): conquering with 3+ excess damage plays a Bird token", () => {
  it("plays the token when excess damage meets the threshold", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-217", units: { "0": [], "1": [] }, controller: null };
    const attacker = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    attacker.tempMightBonus = 5; // Might 7
    moveToBattlefield(game, attacker.instanceId, 0);
    const defender = putOnBase(game, "unit-plain-footman", "1"); // Might 2 (toughness 2)
    moveToBattlefield(game, defender.instanceId, 0);

    // 7 attacking Might vs 2 toughness defender: 5 excess damage, defender dies, attacker (toughness 7) survives the 2 damage swung back.
    resolveCombat(game, getCard, 0, "0");

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-bird-deflect");
    expect(tokenId).toBeDefined();
  });

  it("does not play the token below the threshold", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-217", units: { "0": [], "1": [] }, controller: null };
    const attacker = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    attacker.tempMightBonus = 2; // Might 4
    moveToBattlefield(game, attacker.instanceId, 0);
    const defender = putOnBase(game, "unit-plain-footman", "1"); // Might 2 (toughness 2)
    moveToBattlefield(game, defender.instanceId, 0);

    // 4 attacking Might vs 2 toughness defender: 2 excess damage (below the 3 threshold), defender still dies.
    resolveCombat(game, getCard, 0, "0");

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-bird-deflect");
    expect(tokenId).toBeUndefined();
  });
});

describe("Lonely Poro reprint (unl-221): Deathknell draws 1 if it died alone", () => {
  it("shares the sfd/ogn Lonely Poro handler", () => {
    const game = makeGame();
    const poro = putOnBase(game, "unl-221", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    destroyInstance(game, getCard, poro.instanceId);
    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Xerath, Freed (unl-26): Fury Rune, Exhaust: deal 3 to a unit, only at a battlefield", () => {
  it("deals 3 damage while at a battlefield", () => {
    const game = makeGame();
    const xerath = putOnBase(game, "unl-26", "0");
    moveToBattlefield(game, xerath.instanceId, 0);
    const target = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onActivate(game, getCard(xerath.cardId), xerath, target.instanceId);

    expect(target.damage).toBe(3);
  });

  it("does nothing while not at a battlefield", () => {
    const game = makeGame();
    const xerath = putOnBase(game, "unl-26", "0"); // still on base
    const target = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onActivate(game, getCard(xerath.cardId), xerath, target.instanceId);

    expect(target.damage).toBe(0);
  });
});

describe("Monch (unl-35): cost reduction + enters ready if an opponent controls a stunned unit", () => {
  it("costs 2 less and enters ready when the opponent has a stunned unit", () => {
    const game = makeGame();
    const stunned = putOnBase(game, "unit-plain-footman", "1");
    stunned.statuses.stunned = true;
    const monch = putOnBase(game, "unl-35", "0");

    expect(SpecialCaseEngine.costReduction(game, getCard(monch.cardId), monch)).toBe(2);
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(monch.cardId), monch)).toBe(true);
  });

  it("gives no reduction and doesn't enter ready otherwise", () => {
    const game = makeGame();
    const monch = putOnBase(game, "unl-35", "0");

    expect(SpecialCaseEngine.costReduction(game, getCard(monch.cardId), monch)).toBe(0);
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(monch.cardId), monch)).toBe(false);
  });
});

describe("Shadow Watcher (unl-37): enters ready if a friendly unit died during my Beginning Phase this turn", () => {
  it("enters ready when a friendly unit died during Beginning Phase", () => {
    const game = makeGame();
    game.players["0"].friendlyUnitDiedDuringBeginningThisTurn = true;
    const watcher = putOnBase(game, "unl-37", "0");
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(watcher.cardId), watcher)).toBe(true);
  });

  it("does not enter ready otherwise", () => {
    const game = makeGame();
    const watcher = putOnBase(game, "unl-37", "0");
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(watcher.cardId), watcher)).toBe(false);
  });

  it("actually sets the flag when a friendly unit dies during the real Beginning Phase", () => {
    const game = makeGame();
    game.turnPhase = "beginning";
    const ally = putOnBase(game, "unit-plain-footman", "0");
    destroyInstance(game, getCard, ally.instanceId);
    expect(game.players["0"].friendlyUnitDiedDuringBeginningThisTurn).toBe(true);
  });
});

describe("Enthusiastic Promoter (unl-43): [Backline] when I hold, buff all units here", () => {
  it("buffs every unit at its battlefield, both controllers", () => {
    const game = makeGame();
    const promoter = putOnBase(game, "unl-43", "0");
    moveToBattlefield(game, promoter.instanceId, 0);
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onHold(game, getCard(promoter.cardId), promoter);

    expect(promoter.statuses.buffed).toBe(true);
    expect(ally.statuses.buffed).toBe(true);
    expect(enemy.statuses.buffed).toBe(true);
  });
});

describe("Trevor Snoozebottom (unl-48): [Shield] when I hold, play a ready 3 Might Sprite token here", () => {
  it("plays the token at its battlefield, ready", () => {
    const game = makeGame();
    const trevor = putOnBase(game, "unl-48", "0");
    moveToBattlefield(game, trevor.instanceId, 0);

    SpecialCaseEngine.onHold(game, getCard(trevor.cardId), trevor);

    const tokenId = game.battlefields[0].units["0"].find(
      (id) => game.instances[id].cardId === "token-sprite-temporary",
    );
    expect(tokenId).toBeDefined();
    expect(game.instances[tokenId!].exhausted).toBe(false);
  });
});

describe("Vex, Mocking (unl-55): moves to a battlefield where I stunned an enemy unit", () => {
  it("moves from base to the stunned unit's battlefield", () => {
    const game = makeGame();
    const vex = putOnBase(game, "unl-55", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onAllyStun(game, getCard, "0", enemy);

    expect(vex.zone).toBe("battlefield");
    expect(vex.battlefieldIndex).toBe(0);
    expect(game.battlefields[0].units["0"]).toContain(vex.instanceId);
    expect(game.players["0"].base).not.toContain(vex.instanceId);
  });

  it("does nothing if the stunned unit isn't at a battlefield", () => {
    const game = makeGame();
    const vex = putOnBase(game, "unl-55", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1"); // still on base

    SpecialCaseEngine.onAllyStun(game, getCard, "0", enemy);

    expect(vex.zone).toBe("base");
  });
});

describe("Crescent Strike (unl-72): deal 4 to a unit, 1 to each other enemy unit at its battlefield", () => {
  it("deals 4 to the chosen target and 1 to other enemies there, not to allies", () => {
    const game = makeGame();
    const strike = putOnBase(game, "unl-72", "0");
    const target = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, target.instanceId, 0);
    const otherEnemy = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, otherEnemy.instanceId, 0);
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(strike.cardId), strike, target.instanceId);

    expect(target.damage).toBe(4);
    expect(otherEnemy.damage).toBe(1);
    expect(ally.damage).toBe(0);
  });
});

describe("Sprite Fountain (unl-78): play a ready Sprite token on play, repeat on Deathknell", () => {
  it("plays a token when played and again when destroyed", () => {
    const game = makeGame();
    const fountain = putOnBase(game, "unl-78", "0");
    SpecialCaseEngine.onPlay(game, getCard(fountain.cardId), fountain);
    let tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-sprite-temporary");
    expect(tokens).toHaveLength(1);

    destroyInstance(game, getCard, fountain.instanceId);
    tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-sprite-temporary");
    expect(tokens).toHaveLength(2);
  });
});

describe("Hwei, Brooding Painter (unl-80): on move, draw 1 discard 1, branch on discarded type", () => {
  it("draws an extra card if the discarded card was a spell", () => {
    const game = makeGame();
    const hwei = putOnBase(game, "unl-80", "0");
    game.players["0"].hand = ["ogn-5"]; // Disintegrate, a spell — discarded first
    game.players["0"].mainDeck = ["unit-plain-footman", "ogn-4"];

    SpecialCaseEngine.onMove(game, getCard(hwei.cardId), hwei);

    expect(game.players["0"].trash).toContain("ogn-5");
    expect(game.players["0"].hand).toEqual(["unit-plain-footman", "ogn-4"]);
  });

  it("readies up to 2 runes if the discarded card was a gear", () => {
    const game = makeGame();
    const hwei = putOnBase(game, "unl-80", "0");
    game.players["0"].hand = ["gear-tactical-banner"];
    game.players["0"].mainDeck = [];
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Fury", exhausted: true },
      { instanceId: "r2", domain: "Fury", exhausted: true },
    ];

    SpecialCaseEngine.onMove(game, getCard(hwei.cardId), hwei);

    expect(game.players["0"].runePool.every((r) => !r.exhausted)).toBe(true);
  });

  it("gives +3 Might this turn if the discarded card was a unit", () => {
    const game = makeGame();
    const hwei = putOnBase(game, "unl-80", "0");
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].mainDeck = [];

    SpecialCaseEngine.onMove(game, getCard(hwei.cardId), hwei);

    expect(hwei.tempMightBonus).toBe(3);
  });
});

describe("Gutter Palace (unl-88): alt win condition + discard-to-play a Bird token", () => {
  it("wins the game with exactly 4 cards in hand and 4 units at battlefields", () => {
    const game = makeGame();
    const palace = putOnBase(game, "unl-88", "0");
    game.players["0"].hand = ["ogn-4", "ogn-5", "ogn-8", "ogn-43"];
    for (let i = 0; i < 4; i += 1) {
      const unit = putOnBase(game, "unit-plain-footman", "0");
      moveToBattlefield(game, unit.instanceId, i % 2);
    }

    SpecialCaseEngine.onBeginning(game, getCard(palace.cardId), palace);

    expect(game.winner).toBe("0");
  });

  it("does not win with the wrong counts", () => {
    const game = makeGame();
    const palace = putOnBase(game, "unl-88", "0");
    game.players["0"].hand = ["ogn-4"];

    SpecialCaseEngine.onBeginning(game, getCard(palace.cardId), palace);

    expect(game.winner).toBeNull();
  });

  it("plays a Bird Deflect token when activated", () => {
    const game = makeGame();
    const palace = putOnBase(game, "unl-88", "0");
    SpecialCaseEngine.onActivate(game, getCard(palace.cardId), palace);
    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-bird-deflect");
    expect(tokenId).toBeDefined();
  });
});

describe("LeBlanc, Everywhere at Once (unl-90): [Backline] Temporary effects at my battlefield don't trigger", () => {
  it("prevents a friendly Temporary unit at LeBlanc's battlefield from dying at Beginning", () => {
    const game = makeGame();
    const leblanc = putOnBase(game, "unl-90", "0");
    moveToBattlefield(game, leblanc.instanceId, 0);
    const sprite = putOnBase(game, "token-sprite-temporary", "0");
    moveToBattlefield(game, sprite.instanceId, 0);

    runBeginning(game, "0");

    expect(game.instances[sprite.instanceId]).toBeDefined();
  });

  it("still kills a Temporary unit at a different battlefield", () => {
    const game = makeGame();
    const leblanc = putOnBase(game, "unl-90", "0");
    moveToBattlefield(game, leblanc.instanceId, 0);
    const sprite = putOnBase(game, "token-sprite-temporary", "0");
    moveToBattlefield(game, sprite.instanceId, 1);

    runBeginning(game, "0");

    expect(game.instances[sprite.instanceId]).toBeUndefined();
  });
});

describe("Crowd Favorite (unl-102): [Hunt] Spend 2 XP: Buff me", () => {
  it("buffs itself when activated", () => {
    const game = makeGame();
    const favorite = putOnBase(game, "unl-102", "0");
    favorite.xp = 2;
    SpecialCaseEngine.onActivate(game, getCard(favorite.cardId), favorite);
    expect(favorite.statuses.buffed).toBe(true);
  });

  it("enforces the spendXP cost through the real activateAbility move", () => {
    const game = makeGame();
    const favorite = putOnBase(game, "unl-102", "0", { exhausted: false });
    favorite.xp = 1; // not enough

    const blocked = activateAbility(ctx(game, "0"), { instanceId: favorite.instanceId, energyRuneIds: [] });
    expect(blocked).toBe(INVALID_MOVE);
    expect(favorite.statuses.buffed).toBeFalsy();

    favorite.xp = 2;
    const ok = activateAbility(ctx(game, "0"), { instanceId: favorite.instanceId, energyRuneIds: [] });
    expect(ok).toBeUndefined();
    expect(favorite.xp).toBe(0);
    expect(favorite.statuses.buffed).toBe(true);
  });
});

describe("Enthralling Protector reprint (unl-162): shares the Crowd Favorite handler", () => {
  it("buffs itself when activated", () => {
    const game = makeGame();
    const protector = putOnBase(game, "unl-162", "0");
    protector.xp = 2;
    SpecialCaseEngine.onActivate(game, getCard(protector.cardId), protector);
    expect(protector.statuses.buffed).toBe(true);
  });
});

describe("Poppy, Paragon (unl-116): ready + gain 3 XP if an opponent is within 3 of Victory Score", () => {
  it("readies and grants XP when the opponent is close to winning", () => {
    const game = makeGame();
    game.players["1"].points = 6; // Victory Score 8, within 3
    const poppy = putOnBase(game, "unl-116", "0");
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(poppy.cardId), poppy)).toBe(true);
    SpecialCaseEngine.onPlay(game, getCard(poppy.cardId), poppy);
    expect(game.players["0"].xp).toBe(3);
  });

  it("does nothing when the opponent is far from winning", () => {
    const game = makeGame();
    game.players["1"].points = 1;
    const poppy = putOnBase(game, "unl-116", "0");
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(poppy.cardId), poppy)).toBe(false);
    SpecialCaseEngine.onPlay(game, getCard(poppy.cardId), poppy);
    expect(game.players["0"].xp).toBe(0);
  });
});

describe("Crescent Guardian (unl-122): enters ready if a spell was played this turn and the additional cost was paid", () => {
  it("enters ready when both conditions hold", () => {
    const game = makeGame();
    game.players["0"].playedSpellThisTurn = true;
    const guardian = putOnBase(game, "unl-122", "0");
    guardian.statuses.paidAdditionalCostThisTurn = true;
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(guardian.cardId), guardian)).toBe(true);
  });

  it("does not enter ready if no spell was played this turn", () => {
    const game = makeGame();
    const guardian = putOnBase(game, "unl-122", "0");
    guardian.statuses.paidAdditionalCostThisTurn = true;
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(guardian.cardId), guardian)).toBe(false);
  });

  it("playedSpellThisTurn is actually set by the real playCard move", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-5"]; // Disintegrate, a spell, Energy 4
    game.players["0"].runePool = Array.from({ length: 4 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));
    const target = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, target.instanceId, 0);
    expect(game.players["0"].playedSpellThisTurn).toBe(false);

    playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r0", "r1", "r2", "r3"],
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(game.players["0"].playedSpellThisTurn).toBe(true);
  });
});

describe("Megatusk (unl-126): Spend 3 XP: give your units here Ganking this turn", () => {
  it("grants Ganking to every friendly unit at its battlefield", () => {
    const game = makeGame();
    const megatusk = putOnBase(game, "unl-126", "0");
    megatusk.xp = 3;
    moveToBattlefield(game, megatusk.instanceId, 0);
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onActivate(game, getCard(megatusk.cardId), megatusk);

    expect(megatusk.grantedThisTurn).toContainEqual({ keyword: "ganking" });
    expect(ally.grantedThisTurn).toContainEqual({ keyword: "ganking" });
    expect(enemy.grantedThisTurn).toEqual([]);
  });
});

describe("Ultrasoft Poro (unl-160): Exhaust, at a battlefield: play two Bird Deflect tokens", () => {
  it("plays two tokens at its battlefield", () => {
    const game = makeGame();
    const poro = putOnBase(game, "unl-160", "0");
    moveToBattlefield(game, poro.instanceId, 0);

    SpecialCaseEngine.onActivate(game, getCard(poro.cardId), poro);

    const tokens = game.battlefields[0].units["0"].filter(
      (id) => game.instances[id].cardId === "token-bird-deflect",
    );
    expect(tokens).toHaveLength(2);
  });

  it("does nothing while not at a battlefield", () => {
    const game = makeGame();
    const poro = putOnBase(game, "unl-160", "0"); // still on base
    SpecialCaseEngine.onActivate(game, getCard(poro.cardId), poro);
    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-bird-deflect");
    expect(tokens).toHaveLength(0);
  });
});

describe("Divining Shells (unl-161): [Vision] Kill this, Exhaust: give a unit +2 Might this turn", () => {
  it("buffs the target and destroys itself", () => {
    const game = makeGame();
    const shells = putOnBase(game, "unl-161", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onActivate(game, getCard(shells.cardId), shells, target.instanceId);

    expect(target.tempMightBonus).toBe(2);
  });
});

describe("Shadow's Call (unl-165): give a friendly unit Temporary, draw 2", () => {
  it("marks the target Temporary and draws 2", () => {
    const game = makeGame();
    const call = putOnBase(game, "unl-165", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];

    SpecialCaseEngine.onPlay(game, getCard(call.cardId), call, target.instanceId);

    expect(target.statuses.temporary).toBe(true);
    expect(game.players["0"].hand).toEqual(["ogn-4", "ogn-5"]);
  });
});

describe("Galio, Indefatigable (unl-171): deals no combat damage", () => {
  it("does not damage the defender in combat", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "battlefield-ancient-ruins", units: { "0": [], "1": [] }, controller: null };
    const galio = putOnBase(game, "unl-171", "0");
    moveToBattlefield(game, galio.instanceId, 0);
    const defender = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, defender.instanceId, 0);

    resolveCombat(game, getCard, 0, "0");

    expect(defender.damage).toBe(0);
  });
});

describe("Shard of Undoing (unl-174): first friendly Beginning-Phase death forces an opponent kill, once per turn", () => {
  it("kills an enemy unit the first time, not the second", () => {
    const game = makeGame();
    game.turnPhase = "beginning";
    const shard = putOnBase(game, "unl-174", "0");
    const ally1 = putOnBase(game, "unit-plain-footman", "0");
    const ally2 = putOnBase(game, "unit-plain-footman", "0");
    const enemy1 = putOnBase(game, "unit-plain-footman", "1");
    const enemy2 = putOnBase(game, "unit-plain-footman", "1");
    void shard;

    destroyInstance(game, getCard, ally1.instanceId);
    expect(game.instances[enemy1.instanceId]).toBeUndefined();
    expect(game.instances[enemy2.instanceId]).toBeDefined();

    destroyInstance(game, getCard, ally2.instanceId);
    expect(game.instances[enemy2.instanceId]).toBeDefined(); // second death this turn doesn't retrigger
  });

  it("does nothing outside the Beginning Phase", () => {
    const game = makeGame();
    game.turnPhase = "main";
    putOnBase(game, "unl-174", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1");

    destroyInstance(game, getCard, ally.instanceId);
    expect(game.instances[enemy.instanceId]).toBeDefined();
  });
});

describe("The Ruination (unl-180): kill all units", () => {
  it("destroys every unit and champion on both sides", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-180", "0");
    const a = putOnBase(game, "unit-plain-footman", "0");
    const b = putOnBase(game, "unit-plain-footman", "1");
    const gear = putOnBase(game, "gear-tactical-banner", "0");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    expect(game.instances[a.instanceId]).toBeUndefined();
    expect(game.instances[b.instanceId]).toBeUndefined();
    expect(game.instances[gear.instanceId]).toBeDefined(); // not a unit/champion
  });
});

describe("Maduli the Gatekeeper (unl-144): can't be readied; Chaos Rune: move to a beatable enemy battlefield", () => {
  it("never readies during Awaken", () => {
    const game = makeGame();
    const maduli = putOnBase(game, "unl-144", "0", { exhausted: true });
    runAwaken(game, "0");
    expect(maduli.exhausted).toBe(true);
  });

  it("moves to the first enemy battlefield it can beat", () => {
    const game = makeGame();
    const maduli = putOnBase(game, "unl-144", "0"); // Might 6
    const weakEnemy = putOnBase(game, "unit-plain-footman", "1"); // Might 2
    moveToBattlefield(game, weakEnemy.instanceId, 1);

    SpecialCaseEngine.onActivate(game, getCard(maduli.cardId), maduli);

    expect(maduli.zone).toBe("battlefield");
    expect(maduli.battlefieldIndex).toBe(1);
  });

  it("does not move if no enemy battlefield is beatable", () => {
    const game = makeGame();
    const maduli = putOnBase(game, "unl-144", "0");
    const strongEnemy = putOnBase(game, "unit-plain-footman", "1");
    strongEnemy.tempMightBonus = 10;
    moveToBattlefield(game, strongEnemy.instanceId, 1);

    SpecialCaseEngine.onActivate(game, getCard(maduli.cardId), maduli);

    expect(maduli.zone).toBe("base");
  });
});

describe("Shadow (unl-194): enters ready if played to a battlefield; Exhaust: stun an attacker here", () => {
  it("enters ready when its zone is battlefield", () => {
    const game = makeGame();
    const shadow = putOnBase(game, "unl-194", "0");
    moveToBattlefield(game, shadow.instanceId, 0);
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(shadow.cardId), shadow)).toBe(true);
  });

  it("does not enter ready while on base", () => {
    const game = makeGame();
    const shadow = putOnBase(game, "unl-194", "0");
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(shadow.cardId), shadow)).toBe(false);
  });

  it("stuns an enemy unit at its own battlefield when activated", () => {
    const game = makeGame();
    const shadow = putOnBase(game, "unl-194", "0");
    moveToBattlefield(game, shadow.instanceId, 0);
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onActivate(game, getCard(shadow.cardId), shadow, enemy.instanceId);

    expect(enemy.statuses.stunned).toBe(true);
  });
});

describe("Daisy! (unl-196): enters ready; cost reduction per tribal tag; stun on attack with all 4", () => {
  it("gives 1 cost reduction per distinct tribal tag among your units", () => {
    const game = makeGame();
    const daisyCard = putOnBase(game, "unl-196", "0");
    putOnBase(game, "sfd-36", "0"); // Lonely Poro — tag Poro
    expect(SpecialCaseEngine.costReduction(game, getCard(daisyCard.cardId), daisyCard)).toBe(1);
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(daisyCard.cardId), daisyCard)).toBe(true);
  });

  it("stuns an enemy unit on attack only when all 4 tags are present", () => {
    const game = makeGame();
    const daisyCard = putOnBase(game, "unl-196", "0");
    moveToBattlefield(game, daisyCard.instanceId, 0);
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(daisyCard.cardId), daisyCard);
    expect(enemy.statuses.stunned).toBeFalsy();

    putOnBase(game, "sfd-36", "0"); // Poro
    // Fake the remaining 3 tags via directly-tagged plain units isn't available in the card
    // pool used here, so just verify the gating logic short-circuits below 4 distinct tags.
    SpecialCaseEngine.onAttack(game, getCard(daisyCard.cardId), daisyCard);
    expect(enemy.statuses.stunned).toBeFalsy();
  });
});

describe("Moonfall (unl-198): move an enemy unit to your battlefield, then -2 Might to enemies there", () => {
  it("moves the enemy unit and weakens enemies at the anchor battlefield", () => {
    const game = makeGame();
    const moonfallCard = putOnBase(game, "unl-198", "0");
    const anchor = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, anchor.instanceId, 0);
    const enemy = putOnBase(game, "unit-plain-footman", "1"); // still on base

    SpecialCaseEngine.onPlay(game, getCard(moonfallCard.cardId), moonfallCard, anchor.instanceId);

    expect(enemy.zone).toBe("battlefield");
    expect(enemy.battlefieldIndex).toBe(0);
    expect(enemy.tempMightBonus).toBe(-2);
  });
});

describe("Isolate (unl-124): move an enemy unit to its base, draw if it leaves an enemy alone there", () => {
  it("draws when exactly one enemy remains at the battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-124", "0");
    const moved = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, moved.instanceId, 0);
    const remaining = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, remaining.instanceId, 0);
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, moved.instanceId);

    expect(moved.zone).toBe("base");
    expect(game.players["1"].base).toContain(moved.instanceId);
    expect(game.players["0"].hand).toEqual(["ogn-4"]);
  });

  it("does not draw when the battlefield ends up empty of enemies", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-124", "0");
    const moved = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, moved.instanceId, 0);
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, moved.instanceId);

    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Heroic Charge (unl-155): +1 Might to a friendly unit and stun an enemy at its location", () => {
  it("buffs the target and stuns the enemy there", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-155", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, ally.instanceId);

    expect(ally.tempMightBonus).toBe(1);
    expect(enemy.statuses.stunned).toBe(true);
  });
});

describe("Vex, Apathetic (unl-150): [Deflect] stuns and locks down enemy units played to my battlefield", () => {
  it("stuns and blocks moving a unit the opponent plays while Vex is there", () => {
    const game = makeGame();
    const vex = putOnBase(game, "unl-150", "0");
    moveToBattlefield(game, vex.instanceId, 0);
    const played = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onEnemyCardPlayed(game, getCard, "1", getCard(played.cardId), played);

    expect(played.statuses.stunned).toBe(true);
    expect(played.statuses.cantMoveThisTurn).toBe(true);
  });

  it("is wired through the real playCard move", () => {
    const game = makeGame();
    const vex = putOnBase(game, "unl-150", "0");
    moveToBattlefield(game, vex.instanceId, 0);
    game.players["1"].hand = ["unit-plain-footman"];
    game.players["1"].runePool = [{ instanceId: "r0", domain: "Fury", exhausted: false }];

    playCard(ctx(game, "1"), { handIndex: 0, energyRuneIds: ["r0"], powerRuneIds: [] });

    const newInstanceId = game.players["1"].base.find((id) => game.instances[id].cardId === "unit-plain-footman");
    expect(game.instances[newInstanceId!].statuses.stunned).toBe(true);
  });

  it("does not trigger while Vex isn't at a battlefield", () => {
    const game = makeGame();
    const vex = putOnBase(game, "unl-150", "0"); // still on base
    const played = putOnBase(game, "unit-plain-footman", "1");
    void vex;

    SpecialCaseEngine.onEnemyCardPlayed(game, getCard, "1", getCard(played.cardId), played);

    expect(played.statuses.stunned).toBeFalsy();
  });
});

describe("Prepared Neophyte (unl-4): +4 Might if 4+ Energy was spent on a spell this turn", () => {
  it("gets the bonus once the threshold is met", () => {
    const game = makeGame();
    const neophyte = putOnBase(game, "unl-4", "0");
    expect(SpecialCaseEngine.staticMightModifier(game, getCard(neophyte.cardId), neophyte)).toBe(0);
    game.players["0"].maxEnergySpentOnSpellThisTurn = 4;
    expect(SpecialCaseEngine.staticMightModifier(game, getCard(neophyte.cardId), neophyte)).toBe(4);
  });

  it("is actually tracked by the real playCard move", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-5"]; // Disintegrate, Energy 4
    game.players["0"].runePool = Array.from({ length: 4 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));
    const target = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, target.instanceId, 0);

    playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r0", "r1", "r2", "r3"],
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(game.players["0"].maxEnergySpentOnSpellThisTurn).toBe(4);
  });
});

describe("Lord Broadmane (unl-12): [Ambush] on play, grant Assault to other units here", () => {
  it("grants Assault to other friendly units at its battlefield, not itself", () => {
    const game = makeGame();
    const broadmane = putOnBase(game, "unl-12", "0");
    moveToBattlefield(game, broadmane.instanceId, 0);
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(broadmane.cardId), broadmane);

    expect(ally.grantedThisTurn).toContainEqual({ keyword: "assault", value: 1 });
    expect(broadmane.grantedThisTurn).toEqual([]);
  });
});

describe("Monster Harpoon (unl-14): deal 2 to a unit at a battlefield", () => {
  it("deals 2 damage to the target", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-14", "0");
    const target = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, target.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.damage).toBe(2);
  });
});

describe("Yeti Brawler (unl-18): conquering with 3+ excess damage plays two exhausted Gold tokens", () => {
  it("plays two exhausted Gold gear tokens", () => {
    const game = makeGame();
    const yeti = putOnBase(game, "unl-18", "0");
    SpecialCaseEngine.onConquer(game, getCard(yeti.cardId), yeti, 3);
    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokens).toHaveLength(2);
    expect(tokens.every((id) => game.instances[id].exhausted)).toBe(true);
  });

  it("does not play tokens below the threshold", () => {
    const game = makeGame();
    const yeti = putOnBase(game, "unl-18", "0");
    SpecialCaseEngine.onConquer(game, getCard(yeti.cardId), yeti, 2);
    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokens).toHaveLength(0);
  });
});

describe("Combat Experience (unl-31): +1 Might this turn, +3 instead at Level 6", () => {
  it("gives +1 normally", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-31", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(target.tempMightBonus).toBe(1);
  });

  it("gives +3 at 6+ XP", () => {
    const game = makeGame();
    game.players["0"].xp = 6;
    const spell = putOnBase(game, "unl-31", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(target.tempMightBonus).toBe(3);
  });
});

describe("Friendship (unl-46): +1 Might this turn per tribal tag among your units", () => {
  it("counts distinct tribal tags", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-46", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    putOnBase(game, "sfd-36", "0"); // Lonely Poro — tag Poro

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(target.tempMightBonus).toBe(1);
  });
});

describe("Scuttle Crab (unl-53): draw 1 on play; Deathknell gains 1 XP", () => {
  it("draws on play and gains XP on death", () => {
    const game = makeGame();
    const crab = putOnBase(game, "unl-53", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    SpecialCaseEngine.onPlay(game, getCard(crab.cardId), crab);
    expect(game.players["0"].hand).toEqual(["ogn-4"]);

    destroyInstance(game, getCard, crab.instanceId);
    expect(game.players["0"].xp).toBe(1);
  });
});

describe("Yuumi, Magical Cat (unl-56): on attack or defend, buff another friendly unit here", () => {
  it("buffs an ally on attack", () => {
    const game = makeGame();
    const yuumi = putOnBase(game, "unl-56", "0");
    moveToBattlefield(game, yuumi.instanceId, 0);
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(yuumi.cardId), yuumi);

    expect(ally.tempMightBonus).toBe(3);
    expect(ally.grantedThisTurn).toContainEqual({ keyword: "tank" });
  });

  it("buffs an ally on defend", () => {
    const game = makeGame();
    const yuumi = putOnBase(game, "unl-56", "0");
    moveToBattlefield(game, yuumi.instanceId, 0);
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);

    SpecialCaseEngine.onDefend(game, getCard(yuumi.cardId), yuumi);

    expect(ally.tempMightBonus).toBe(3);
  });
});

describe("Lillia, Protector of Dreams (unl-58): +1 Might this turn when you play a token unit", () => {
  it("buffs itself when a token unit is created via the token helpers", () => {
    const game = makeGame();
    const lillia = putOnBase(game, "unl-58", "0");
    playTokenToBase(game, "token-recruit", "0");
    expect(lillia.tempMightBonus).toBe(1);
  });

  it("does not buff for a non-unit token", () => {
    const game = makeGame();
    const lillia = putOnBase(game, "unl-58", "0");
    playTokenToBase(game, "token-gold-gear", "0");
    expect(lillia.tempMightBonus).toBe(0);
  });
});

describe("Vilemaw (unl-60): [Ambush] weaker enemy units here deal no combat damage; draw 1 on hold", () => {
  it("prevents a weaker enemy from dealing combat damage", () => {
    const game = makeGame();
    const vilemawUnit = putOnBase(game, "unl-60", "0"); // Might 8
    moveToBattlefield(game, vilemawUnit.instanceId, 0);
    const weakEnemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, weakEnemy.instanceId, 0);

    resolveCombat(game, getCard, 0, "0");

    expect(vilemawUnit.damage).toBe(0);
  });

  it("draws 1 when held", () => {
    const game = makeGame();
    const vilemawUnit = putOnBase(game, "unl-60", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    SpecialCaseEngine.onHold(game, getCard(vilemawUnit.cardId), vilemawUnit);
    expect(game.players["0"].hand).toEqual(["ogn-4"]);
  });
});

describe("Eclipse (unl-63): -4 Might this turn to a unit", () => {
  it("applies the penalty", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-63", "0");
    const target = putOnBase(game, "unit-plain-footman", "1");
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(target.tempMightBonus).toBe(-4);
  });
});

describe("Chakram Dancer (unl-71): [Ambush] on play, grant Shield to other units here", () => {
  it("grants Shield to other friendly units at its battlefield, not itself", () => {
    const game = makeGame();
    const dancer = putOnBase(game, "unl-71", "0");
    moveToBattlefield(game, dancer.instanceId, 0);
    const ally = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, ally.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(dancer.cardId), dancer);

    expect(ally.grantedThisTurn).toContainEqual({ keyword: "shield", value: 1 });
    expect(dancer.grantedThisTurn).toEqual([]);
  });
});

describe("Deadly Flourish (unl-73): deal 3 to an enemy unit, Gold token if it dies", () => {
  it("plays a token when the damage is lethal", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-73", "0");
    const target = putOnBase(game, "unit-plain-guard", "1"); // Might 1

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenId).toBeDefined();
    expect(game.instances[tokenId!].exhausted).toBe(true);
  });

  it("does not play a token if the target survives", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-73", "0");
    const target = putOnBase(game, "unit-plain-footman", "1");
    target.tempMightBonus = 10; // survives 3 damage easily

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenId).toBeUndefined();
  });
});

describe("Sumpworks Map (unl-85): draw 1 when an opponent scores", () => {
  it("draws when the opponent scores via the real Beginning Phase", () => {
    const game = makeGame();
    putOnBase(game, "unl-85", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    game.battlefields[0].controller = "1";

    runBeginning(game, "1");

    expect(game.players["0"].hand).toEqual(["ogn-4"]);
  });

  it("does not draw when the opponent doesn't score", () => {
    const game = makeGame();
    putOnBase(game, "unl-85", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    runBeginning(game, "1");

    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Nidalee, Cat Form (unl-114): [Ambush] draw 1 when I win a combat (survive it)", () => {
  it("draws when it survives a real Showdown", () => {
    const game = makeGame();
    const nidalee = putOnBase(game, "unl-114", "0"); // Might 4
    moveToBattlefield(game, nidalee.instanceId, 0);
    const weakEnemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, weakEnemy.instanceId, 0);
    game.players["0"].mainDeck = ["ogn-4"];

    resolveCombat(game, getCard, 0, "0");

    expect(game.instances[nidalee.instanceId]).toBeDefined();
    expect(game.players["0"].hand).toEqual(["ogn-4"]);
  });

  it("does not draw from an unopposed conquest (no Showdown)", () => {
    const game = makeGame();
    const nidalee = putOnBase(game, "unl-114", "0");
    moveToBattlefield(game, nidalee.instanceId, 0);
    game.players["0"].mainDeck = ["ogn-4"];

    resolveCombat(game, getCard, 0, "0");

    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Rengar, Trophy Hunter (unl-120): can be played to an enemy-occupied battlefield", () => {
  it("allows playing to a battlefield with enemy units even without friendly ones there", () => {
    const game = makeGame();
    const rengar = putOnBase(game, "unl-120", "0");
    expect(SpecialCaseEngine.allowsPlayToEnemyOccupiedBattlefield(game, getCard(rengar.cardId), rengar)).toBe(true);
  });
});

describe("Kha'Zix, Mutating Horror (unl-143): [Ambush] +2 Might and 2 XP on attack/defend vs a lone enemy", () => {
  it("triggers when exactly one enemy unit is at the battlefield", () => {
    const game = makeGame();
    const khazix = putOnBase(game, "unl-143", "0");
    moveToBattlefield(game, khazix.instanceId, 0);
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(khazix.cardId), khazix);

    expect(khazix.tempMightBonus).toBe(2);
    expect(game.players["0"].xp).toBe(2);
  });

  it("does not trigger with more than one enemy unit there", () => {
    const game = makeGame();
    const khazix = putOnBase(game, "unl-143", "0");
    moveToBattlefield(game, khazix.instanceId, 0);
    const enemy1 = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy1.instanceId, 0);
    const enemy2 = putOnBase(game, "unit-plain-footman", "1");
    moveToBattlefield(game, enemy2.instanceId, 0);

    SpecialCaseEngine.onDefend(game, getCard(khazix.cardId), khazix);

    expect(khazix.tempMightBonus).toBe(0);
    expect(game.players["0"].xp).toBe(0);
  });
});

describe("Pyke, Returned (unl-145): [Backline] once per turn, play a Gold token when I kill an enemy here", () => {
  it("plays a token the first time this turn, not the second", () => {
    const game = makeGame();
    const pyke = putOnBase(game, "unl-145", "0");
    moveToBattlefield(game, pyke.instanceId, 0);
    const victim1 = putOnBase(game, "unit-plain-footman", "1");
    const victim2 = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onAllyKillUnit(game, getCard, "0", victim1);
    let tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokens).toHaveLength(1);

    SpecialCaseEngine.onAllyKillUnit(game, getCard, "0", victim2);
    tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokens).toHaveLength(1); // still just one — the once-per-turn gate held
  });

  it("does not trigger while not at a battlefield", () => {
    const game = makeGame();
    putOnBase(game, "unl-145", "0"); // still on base
    const victim = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onAllyKillUnit(game, getCard, "0", victim);

    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokens).toHaveLength(0);
  });
});

describe("Grim Resolve (unl-95): +3 Might this turn, gain 2 XP if it wins a combat this turn", () => {
  it("grants the XP when the buffed unit survives a real Showdown", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-95", "0");
    const target = putOnBase(game, "unit-plain-guard", "0"); // Might 1
    moveToBattlefield(game, target.instanceId, 0);
    const weakEnemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1, dies to the buffed 4 Might
    moveToBattlefield(game, weakEnemy.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(target.tempMightBonus).toBe(3);

    resolveCombat(game, getCard, 0, "0");

    expect(game.instances[target.instanceId]).toBeDefined();
    expect(game.players["0"].xp).toBe(2);
  });

  it("does not grant XP if the unit never enters combat this turn", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-95", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, target.instanceId);
    expect(game.players["0"].xp).toBe(0);
  });
});

describe("Stare Down (unl-107): move weaker enemy units at the anchor battlefield to base, gain 1 XP", () => {
  it("moves only enemies weaker than the anchor unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-107", "0");
    const anchor = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    moveToBattlefield(game, anchor.instanceId, 0);
    const weakEnemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, weakEnemy.instanceId, 0);
    const strongEnemy = putOnBase(game, "unit-plain-footman", "1"); // Might 2, not weaker
    moveToBattlefield(game, strongEnemy.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, anchor.instanceId);

    expect(weakEnemy.zone).toBe("base");
    expect(strongEnemy.zone).toBe("battlefield");
    expect(game.players["0"].xp).toBe(1);
  });
});

describe("Ivern, Nurturer (unl-51): look at top 3, draw a unit, buff on tribal hit", () => {
  it("draws the first unit found and buffs a friendly unit if it's a tracked tribe", () => {
    const game = makeGame();
    const ivern = putOnBase(game, "unl-51", "0");
    // unl-51 itself has tags ["Ivern", "Ionia"] (not a tracked tribe) — use it as the buff target check via a second friendly unit.
    const ally = putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].mainDeck = ["ogn-4", "sfd-36", "ogn-5"]; // sfd-36 Lonely Poro is a unit tagged "Poro"

    SpecialCaseEngine.onPlay(game, getCard(ivern.cardId), ivern);

    expect(game.players["0"].hand).toContain("sfd-36");
    expect(game.players["0"].mainDeck).toEqual(expect.arrayContaining(["ogn-4", "ogn-5"]));
    expect(game.players["0"].mainDeck).not.toContain("sfd-36");
    expect(ivern.statuses.buffed || ally.statuses.buffed).toBe(true);
  });

  it("recycles all 3 and doesn't draw if no unit is among them", () => {
    const game = makeGame();
    const ivern = putOnBase(game, "unl-51", "0");
    game.players["0"].mainDeck = ["ogn-5", "ogn-8", "ogn-43"]; // all spells

    SpecialCaseEngine.onHold(game, getCard(ivern.cardId), ivern);

    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].mainDeck).toHaveLength(3);
  });
});
