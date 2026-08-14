import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { destroyInstance } from "../src/game/combat";
import { runBeginning } from "../src/game/turnFlow";
import { makeGame, putOnBase } from "./helpers";

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
