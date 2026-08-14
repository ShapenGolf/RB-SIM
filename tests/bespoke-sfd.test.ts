import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { destroyInstance } from "../src/game/combat";
import { resolveOptionalCost, playCard } from "../src/game/moves";
import { attachEquipment } from "../src/game/equip";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof resolveOptionalCost>[0];
}

function moveToBattlefield(game: ReturnType<typeof makeGame>, instanceId: string, battlefieldIndex: number) {
  const instance = game.instances[instanceId];
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  game.battlefields[battlefieldIndex].units[instance.controller].push(instanceId);
}

describe("Detonate (sfd-5): kill a gear, its controller draws 2", () => {
  it("kills the target gear and draws its controller 2 cards", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-5", "0");
    const gear = putOnBase(game, "gear-tactical-banner", "1");
    game.players["1"].mainDeck = ["ogn-4", "ogn-5"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, gear.instanceId);

    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toEqual(["ogn-4", "ogn-5"]);
  });
});

describe("Eager Drakehound (sfd-6): enters ready", () => {
  it("reports selfEntersReady true", () => {
    const game = makeGame();
    const drakehound = putOnBase(game, "sfd-6", "0", { exhausted: true });
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(drakehound.cardId), drakehound)).toBe(true);
  });
});

describe("Gem Jammer (sfd-7): on play, grant a friendly unit Ganking this turn", () => {
  it("lets the granted unit move to another battlefield", () => {
    const game = makeGame();
    const gemJammer = putOnBase(game, "sfd-7", "0");
    const target = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, target.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(gemJammer.cardId), gemJammer, target.instanceId);

    expect(target.grantedThisTurn).toContainEqual({ keyword: "ganking" });
  });
});

describe("Ferrous Forerunner (sfd-21): Deathknell plays two Mech tokens", () => {
  it("plays two 3-Might Mech tokens into base", () => {
    const game = makeGame();
    const forerunner = putOnBase(game, "sfd-21", "0");

    destroyInstance(game, getCard, forerunner.instanceId);

    const tokenIds = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-mech-3");
    expect(tokenIds).toHaveLength(2);
  });
});

describe("Poro Snax (sfd-46): draws on play, and again when killed for its cost", () => {
  it("draws 1 on play", () => {
    const game = makeGame();
    const snax = putOnBase(game, "sfd-46", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(snax.cardId), snax);

    expect(game.players["0"].hand).toContain("ogn-4");
  });

  it("draws 1 when killed to pay its activated ability", () => {
    const game = makeGame();
    const snax = putOnBase(game, "sfd-46", "0");
    game.players["0"].mainDeck = ["ogn-5"];

    SpecialCaseEngine.onActivate(game, getCard(snax.cardId), snax);

    expect(game.players["0"].hand).toContain("ogn-5");
  });
});

describe("Aspiring Engineer (sfd-61): on play, return a gear from trash to hand", () => {
  it("returns the first gear found in trash", () => {
    const game = makeGame();
    const engineer = putOnBase(game, "sfd-61", "0");
    game.players["0"].trash = ["unit-plain-guard", "gear-tactical-banner"];

    SpecialCaseEngine.onPlay(game, getCard(engineer.cardId), engineer);

    expect(game.players["0"].trash).toEqual(["unit-plain-guard"]);
    expect(game.players["0"].hand).toContain("gear-tactical-banner");
  });
});

describe("Plundering Poro (sfd-69): on conquer, play a Gold gear token exhausted", () => {
  it("plays an exhausted Gold token into base", () => {
    const game = makeGame();
    const poro = putOnBase(game, "sfd-69", "0");

    SpecialCaseEngine.onConquer(game, getCard(poro.cardId), poro, 0);

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenId).toBeDefined();
    expect(game.instances[tokenId!].exhausted).toBe(true);
  });
});

describe("Laurent Bladekeeper (sfd-96): Ganking restored via data-quirk override", () => {
  it("hasConditionalGanking reports true despite the missing bracket tag", () => {
    const game = makeGame();
    const laurent = putOnBase(game, "sfd-96", "0");
    expect(SpecialCaseEngine.hasConditionalGanking(game, getCard(laurent.cardId), laurent)).toBe(true);
  });
});

describe("Yordle Explorer (sfd-100): draws when an ally plays a 2+ Rune card", () => {
  it("draws only when the played card's Power cost is 2 Rune or more", () => {
    const game = makeGame();
    const explorer = putOnBase(game, "sfd-100", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    const heavyCard = { ...getCard("ogn-4"), powerCost: [{ domain: "Fury" as const, amount: 2 }] };
    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", heavyCard, 1);
    expect(game.players["0"].hand).toContain("ogn-4");

    game.players["0"].mainDeck = ["ogn-5"];
    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("ogn-4"), 2); // 0 Power cost
    expect(game.players["0"].hand).not.toContain("ogn-5");
    void explorer;
  });
});

describe("Treasure Hunter (sfd-130): on move, play a Gold gear token exhausted", () => {
  it("plays an exhausted Gold token when it attacks", () => {
    const game = makeGame();
    const hunter = putOnBase(game, "sfd-130", "0", { exhausted: false });

    SpecialCaseEngine.onMove(game, getCard(hunter.cardId), hunter);

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenId).toBeDefined();
    expect(game.instances[tokenId!].exhausted).toBe(true);
  });
});

describe("Factory Recall (sfd-135): return a gear to its owner's hand", () => {
  it("returns the target gear from base to hand", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-135", "0");
    const gear = putOnBase(game, "gear-tactical-banner", "1");

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell, gear.instanceId);

    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toContain("gear-tactical-banner");
  });
});

describe("Eminent Benefactor (sfd-152): on hold, play two Gold gear tokens exhausted", () => {
  it("plays two exhausted Gold tokens into base", () => {
    const game = makeGame();
    const benefactor = putOnBase(game, "sfd-152", "0");

    SpecialCaseEngine.onHold(game, getCard(benefactor.cardId), benefactor);

    const tokenIds = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenIds).toHaveLength(2);
    expect(tokenIds.every((id) => game.instances[id].exhausted)).toBe(true);
  });
});

describe("Honest Broker (sfd-155): Deathknell plays a Gold gear token exhausted", () => {
  it("plays an exhausted Gold token on death", () => {
    const game = makeGame();
    const broker = putOnBase(game, "sfd-155", "0");

    destroyInstance(game, getCard, broker.instanceId);

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenId).toBeDefined();
    expect(game.instances[tokenId!].exhausted).toBe(true);
  });
});

describe("Sandshifter (sfd-158): on play, kill an enemy unit with 3 Might or less", () => {
  it("kills the first eligible enemy, ignores a too-strong one", () => {
    const game = makeGame();
    const sandshifter = putOnBase(game, "sfd-158", "0");
    const tooStrong = putOnBase(game, "unit-shadow-infiltrator", "1"); // Might 3, but check below
    tooStrong.tempMightBonus = 5; // push it above the 3-Might threshold
    const weak = putOnBase(game, "unit-plain-guard", "1"); // Might 1

    SpecialCaseEngine.onPlay(game, getCard(sandshifter.cardId), sandshifter);

    expect(game.instances[tooStrong.instanceId]).toBeDefined();
    expect(game.instances[weak.instanceId]).toBeUndefined();
  });
});

describe("Trusty Ramhound (sfd-159): +1 Might while another unit is here", () => {
  it("only applies while sharing a location with another unit", () => {
    const game = makeGame();
    const ramhound = putOnBase(game, "sfd-159", "0");
    const baseline = getCard(ramhound.cardId).might!;
    expect(computeMight(game, getCard, ramhound, "none")).toBe(baseline);

    putOnBase(game, "unit-plain-footman", "0");
    expect(computeMight(game, getCard, ramhound, "none")).toBe(baseline + 1);
  });
});

describe("Ribbon Dancer (sfd-38): on move, give another friendly unit +1 Might this turn", () => {
  it("buffs the first other friendly unit found", () => {
    const game = makeGame();
    const dancer = putOnBase(game, "sfd-38", "0", { exhausted: false });
    const ally = putOnBase(game, "unit-plain-footman", "0");

    SpecialCaseEngine.onMove(game, getCard(dancer.cardId), dancer);

    expect(ally.tempMightBonus).toBe(1);
  });
});

describe("Jax, Unrelenting (sfd-119): may pay 1 Energy to draw 1 when Equipment is attached", () => {
  it("offers the decision on equip, and paying it draws a card", () => {
    const game = makeGame();
    const jax = putOnBase(game, "sfd-119", "0");
    const gear = putOnBase(game, "sfd-161", "0"); // B.F. Sword

    attachEquipment(game, getCard, gear.instanceId, jax.instanceId);

    expect(game.pendingOptionalCost).not.toBeNull();
    expect(game.pendingOptionalCost!.specialCaseId).toBe("jax-unrelenting");
    expect(game.pendingOptionalCost!.cost).toEqual({ energy: 1 });

    game.players["0"].mainDeck = ["ogn-4"];
    game.players["0"].runePool = [{ instanceId: "e1", domain: "Fury" as const, exhausted: false }];
    resolveOptionalCost(ctx(game, "0"), { pay: true, energyRuneIds: ["e1"] });

    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Lucian, Merciless (sfd-113): readies on the first conquer each turn", () => {
  it("readies once, then stays exhausted on a second conquer the same turn", () => {
    const game = makeGame();
    const lucian = putOnBase(game, "sfd-113", "0", { exhausted: true });

    SpecialCaseEngine.onConquer(game, getCard(lucian.cardId), lucian, 0);
    expect(lucian.exhausted).toBe(false);

    lucian.exhausted = true;
    SpecialCaseEngine.onConquer(game, getCard(lucian.cardId), lucian, 0);
    expect(lucian.exhausted).toBe(true);
  });
});

describe("Ornn, Forge God (sfd-85): +1 Might for each friendly gear", () => {
  it("counts both attached and unattached friendly gear", () => {
    const game = makeGame();
    const ornn = putOnBase(game, "sfd-85", "0");
    const baseline = computeMight(game, getCard, ornn, "none");

    putOnBase(game, "gear-tactical-banner", "0");
    const gear2 = putOnBase(game, "sfd-161", "0");
    attachEquipment(game, getCard, gear2.instanceId, ornn.instanceId);

    expect(computeMight(game, getCard, ornn, "none")).toBe(baseline + 2);
  });
});

describe("Sivir, Ambitious (sfd-120): deal excess conquer damage to an enemy unit", () => {
  it("deals the excess damage when it's 5 or more", () => {
    const game = makeGame();
    const sivir = putOnBase(game, "sfd-120", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1"); // Might 2

    SpecialCaseEngine.onConquer(game, getCard(sivir.cardId), sivir, 5);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });

  it("does nothing below the 5-excess threshold", () => {
    const game = makeGame();
    const sivir = putOnBase(game, "sfd-120", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1");

    SpecialCaseEngine.onConquer(game, getCard(sivir.cardId), sivir, 4);

    expect(game.instances[enemy.instanceId]).toBeDefined();
  });
});

describe("Yone, Blademaster (sfd-116): conquering an open battlefield hits an enemy in base", () => {
  it("deals Might damage to the first enemy unit in base when excess damage is 0", () => {
    const game = makeGame();
    const yone = putOnBase(game, "sfd-116", "0");
    const enemyInBase = putOnBase(game, "unit-plain-guard", "1"); // Might 1

    SpecialCaseEngine.onConquer(game, getCard(yone.cardId), yone, 0);

    expect(game.instances[enemyInBase.instanceId]).toBeUndefined();
  });
});

describe("Shurelya's Requiem (sfd-192): on play, ready your units", () => {
  it("readies all friendly units and champions, not gear", () => {
    const game = makeGame();
    const requiem = putOnBase(game, "sfd-192", "0");
    const unit = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });
    const gear = putOnBase(game, "gear-tactical-banner", "0", { exhausted: true });

    SpecialCaseEngine.onPlay(game, getCard(requiem.cardId), requiem);

    expect(unit.exhausted).toBe(false);
    expect(gear.exhausted).toBe(true);
  });
});

describe("Battering Ram (sfd-12): cost reduced by cards played this turn, floor 1", () => {
  it("never reduces below 1 Energy", () => {
    const game = makeGame();
    const ram = putOnBase(game, "sfd-12", "0");
    const cost = getCard(ram.cardId).energyCost!;
    game.players["0"].cardsPlayedThisTurn = cost + 10;
    expect(SpecialCaseEngine.costReduction(game, getCard(ram.cardId), ram)).toBe(cost - 1);
  });
});

describe("Dunebreaker (sfd-27): enters ready at low hand size; draws 2 on hold", () => {
  it("enters ready with 2 or fewer cards in hand", () => {
    const game = makeGame();
    const dune = putOnBase(game, "sfd-27", "0");
    game.players["0"].hand = ["ogn-4", "ogn-5"];
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(dune.cardId), dune)).toBe(true);
  });

  it("draws 2 on hold", () => {
    const game = makeGame();
    const dune = putOnBase(game, "sfd-27", "0");
    game.players["0"].mainDeck = ["ogn-4", "ogn-5"];
    SpecialCaseEngine.onHold(game, getCard(dune.cardId), dune);
    expect(game.players["0"].hand).toEqual(["ogn-4", "ogn-5"]);
  });
});

describe("Lucian, Gunslinger (sfd-28): deals Assault damage to an enemy here on attack", () => {
  it("deals 1 (default Assault) to the first enemy at the same battlefield", () => {
    const game = makeGame();
    const lucian = putOnBase(game, "sfd-28", "0");
    moveToBattlefield(game, lucian.instanceId, 0);
    const enemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, enemy.instanceId, 0);

    SpecialCaseEngine.onAttack(game, getCard(lucian.cardId), lucian);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });
});

describe("Guardian of the Passage (sfd-35): on hold, return a unit or gear from trash", () => {
  it("returns the first eligible card", () => {
    const game = makeGame();
    const guardian = putOnBase(game, "sfd-35", "0");
    game.players["0"].trash = ["ogn-5", "unit-plain-guard"];

    SpecialCaseEngine.onHold(game, getCard(guardian.cardId), guardian);

    expect(game.players["0"].trash).toEqual(["ogn-5"]);
    expect(game.players["0"].hand).toContain("unit-plain-guard");
  });
});

describe("Lonely Poro (sfd-36): Deathknell draws 1 if it died alone", () => {
  it("draws when no other friendly unit is at its location", () => {
    const game = makeGame();
    const poro = putOnBase(game, "sfd-36", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    destroyInstance(game, getCard, poro.instanceId);

    expect(game.players["0"].hand).toContain("ogn-4");
  });

  it("does not draw when accompanied", () => {
    const game = makeGame();
    const poro = putOnBase(game, "sfd-36", "0");
    putOnBase(game, "unit-plain-footman", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    destroyInstance(game, getCard, poro.instanceId);

    expect(game.players["0"].hand).not.toContain("ogn-4");
  });
});

describe("Apprentice Smith (sfd-41): on move, reveal top card — draw if gear, else recycle", () => {
  it("draws a revealed gear", () => {
    const game = makeGame();
    const smith = putOnBase(game, "sfd-41", "0", { exhausted: false });
    game.players["0"].mainDeck = ["gear-tactical-banner"];

    SpecialCaseEngine.onMove(game, getCard(smith.cardId), smith);

    expect(game.players["0"].hand).toContain("gear-tactical-banner");
  });

  it("recycles a revealed non-gear", () => {
    const game = makeGame();
    const smith = putOnBase(game, "sfd-41", "0", { exhausted: false });
    game.players["0"].mainDeck = ["unit-plain-guard"];

    SpecialCaseEngine.onMove(game, getCard(smith.cardId), smith);

    expect(game.players["0"].hand).not.toContain("unit-plain-guard");
    expect(game.players["0"].mainDeck).toEqual(["unit-plain-guard"]);
  });
});

describe("Legion Quartermaster (sfd-44): return a friendly gear as an additional cost", () => {
  it("returns the chosen friendly gear to hand", () => {
    const game = makeGame();
    const quartermaster = putOnBase(game, "sfd-44", "0");
    const gear = putOnBase(game, "gear-tactical-banner", "0");

    SpecialCaseEngine.onPlay(game, getCard(quartermaster.cardId), quartermaster, gear.instanceId);

    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("gear-tactical-banner");
  });
});

describe("Ornn, Blacksmith (sfd-58): look at top 4, take a gear, on play and on hold", () => {
  it("takes the first gear found among the top 4 on play", () => {
    const game = makeGame();
    const ornn = putOnBase(game, "sfd-58", "0");
    game.players["0"].mainDeck = ["ogn-4", "gear-tactical-banner", "ogn-5", "unit-plain-guard", "ogn-11"];

    SpecialCaseEngine.onPlay(game, getCard(ornn.cardId), ornn);

    expect(game.players["0"].hand).toEqual(["gear-tactical-banner"]);
    // "ogn-11" was never looked at (5th card, past the top-4 slice) and stays at the front;
    // the three looked-at non-gear cards are recycled to the back in order.
    expect(game.players["0"].mainDeck).toEqual(["ogn-11", "ogn-4", "ogn-5", "unit-plain-guard"]);
  });
});

describe("Bubble Bot (sfd-62): on play, ready another friendly Mech", () => {
  it("readies the first other friendly Mech", () => {
    const game = makeGame();
    const bubbleBot = putOnBase(game, "sfd-62", "0");
    const mech = putOnBase(game, "token-mech-3", "0", { exhausted: true });

    SpecialCaseEngine.onPlay(game, getCard(bubbleBot.cardId), bubbleBot);

    expect(mech.exhausted).toBe(false);
  });
});

describe("Dropboarder (sfd-72): enters ready with 2+ friendly gear", () => {
  it("readies itself when it controls two gear at play time", () => {
    const game = makeGame();
    putOnBase(game, "gear-tactical-banner", "0");
    putOnBase(game, "gear-tactical-banner", "0");
    const dropboarder = putOnBase(game, "sfd-72", "0", { exhausted: true });

    SpecialCaseEngine.onPlay(game, getCard(dropboarder.cardId), dropboarder);

    expect(dropboarder.exhausted).toBe(false);
  });
});

describe("Pickpocket (sfd-74): on play, may kill a cheap enemy gear for a Gold token", () => {
  it("kills the first eligible enemy gear and plays a Gold token", () => {
    const game = makeGame();
    const pickpocket = putOnBase(game, "sfd-74", "0");
    const cheapGear = putOnBase(game, "sfd-134", "1"); // Cull, 1 Energy

    SpecialCaseEngine.onPlay(game, getCard(pickpocket.cardId), pickpocket);

    expect(game.instances[cheapGear.instanceId]).toBeUndefined();
    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenId).toBeDefined();
  });

  it("does nothing without an eligible enemy gear", () => {
    const game = makeGame();
    const pickpocket = putOnBase(game, "sfd-74", "0");

    SpecialCaseEngine.onPlay(game, getCard(pickpocket.cardId), pickpocket);

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenId).toBeUndefined();
  });
});

describe("Production Surge (sfd-76): cheaper with a Mech; plays a Mech token and draws", () => {
  it("plays a 3-Might Mech token and draws a card", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-76", "0");
    game.players["0"].mainDeck = ["ogn-4"];

    SpecialCaseEngine.onPlay(game, getCard(spell.cardId), spell);

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-mech-3");
    expect(tokenId).toBeDefined();
    expect(game.players["0"].hand).toContain("ogn-4");
  });

  it("reduces its own cost by 2 when a Mech is controlled", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-76", "0");
    expect(SpecialCaseEngine.costReduction(game, getCard(spell.cardId), spell)).toBe(0);

    putOnBase(game, "token-mech-3", "0");
    expect(SpecialCaseEngine.costReduction(game, getCard(spell.cardId), spell)).toBe(2);
  });
});

describe("Card Sharp (sfd-81): on play, both sides get Gold tokens, controller gets an extra one", () => {
  it("gives the controller 2 tokens and the opponent 1", () => {
    const game = makeGame();
    const sharp = putOnBase(game, "sfd-81", "0");

    SpecialCaseEngine.onPlay(game, getCard(sharp.cardId), sharp);

    const mine = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    const theirs = game.players["1"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(mine).toHaveLength(2);
    expect(theirs).toHaveLength(1);
  });
});

describe("Jayce, Man of Progress (sfd-84): kill a friendly gear to play a cheap gear free", () => {
  it("only triggers when both a gear to kill and an eligible hand gear exist", () => {
    const game = makeGame();
    const jayce = putOnBase(game, "sfd-84", "0");
    const gearToKill = putOnBase(game, "gear-tactical-banner", "0");
    game.players["0"].hand = ["gear-tactical-banner"];

    SpecialCaseEngine.onPlay(game, getCard(jayce.cardId), jayce);

    expect(game.instances[gearToKill.instanceId]).toBeUndefined();
    const newGear = game.players["0"].base.filter((id) => game.instances[id].cardId === "gear-tactical-banner");
    expect(newGear).toHaveLength(1);
  });

  it("does nothing without a friendly gear to kill", () => {
    const game = makeGame();
    const jayce = putOnBase(game, "sfd-84", "0");
    game.players["0"].hand = ["gear-tactical-banner"];

    SpecialCaseEngine.onPlay(game, getCard(jayce.cardId), jayce);

    expect(game.players["0"].hand).toEqual(["gear-tactical-banner"]);
  });
});

describe("Rumble, Scrapper (sfd-89): Mechs (including self) get +1 Might; plays a token on hold", () => {
  it("buffs itself and other Mechs, not non-Mechs", () => {
    const game = makeGame();
    const rumble = putOnBase(game, "sfd-89", "0");
    const baseline = getCard(rumble.cardId).might!;
    expect(computeMight(game, getCard, rumble, "none")).toBe(baseline + 1);

    const mech = putOnBase(game, "token-mech-3", "0");
    const mechBaseline = getCard(mech.cardId).might!;
    expect(computeMight(game, getCard, mech, "none")).toBe(mechBaseline + 1);

    const recruit = putOnBase(game, "token-recruit", "0");
    expect(computeMight(game, getCard, recruit, "none")).toBe(getCard(recruit.cardId).might!);
  });

  it("plays a Mech token on hold", () => {
    const game = makeGame();
    const rumble = putOnBase(game, "sfd-89", "0");
    SpecialCaseEngine.onHold(game, getCard(rumble.cardId), rumble);
    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-mech-3");
    expect(tokenId).toBeDefined();
  });
});

describe("Buhru Captain (sfd-91): on play, draws 1 (simplified from draw-or-buff)", () => {
  it("draws a card", () => {
    const game = makeGame();
    const captain = putOnBase(game, "sfd-91", "0");
    game.players["0"].mainDeck = ["ogn-4"];
    SpecialCaseEngine.onPlay(game, getCard(captain.cardId), captain);
    expect(game.players["0"].hand).toContain("ogn-4");
  });
});

describe("Dauntless Vanguard (sfd-93): may play to an occupied enemy battlefield", () => {
  it("reports allowsPlayToEnemyOccupiedBattlefield true", () => {
    const game = makeGame();
    const vanguard = putOnBase(game, "sfd-93", "0");
    expect(SpecialCaseEngine.allowsPlayToEnemyOccupiedBattlefield(game, getCard(vanguard.cardId), vanguard)).toBe(true);
  });
});

describe("Direwing (sfd-94): enters ready with another friendly Dragon", () => {
  it("checks for another friendly Dragon-tagged instance", () => {
    const game = makeGame();
    const direwing = putOnBase(game, "sfd-94", "0");
    expect(SpecialCaseEngine.selfEntersReady(game, getCard(direwing.cardId), direwing)).toBe(false);
  });
});

describe("Sea Monkey (sfd-98): pay 1 extra Energy to buff on play", () => {
  it("buffs itself when the additional cost is paid via the real playCard move", () => {
    const game = makeGame();
    const cost = getCard("sfd-98").energyCost!;
    game.players["0"].hand = ["sfd-98"];
    game.players["0"].runePool = Array.from({ length: cost + 1 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Chaos" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
      payAdditionalCost: true,
    });

    expect(result).toBeUndefined();
    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "sfd-98");
    expect(newInstanceId).toBeDefined();
    expect(game.instances[newInstanceId!].statuses.buffed).toBe(true);
  });

  it("does not buff when the additional cost isn't paid", () => {
    const game = makeGame();
    const cost = getCard("sfd-98").energyCost!;
    game.players["0"].hand = ["sfd-98"];
    game.players["0"].runePool = Array.from({ length: cost }, (_, i) => ({
      instanceId: `r${i}`,
      domain: "Chaos" as const,
      exhausted: false,
    }));

    playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
      payAdditionalCost: false,
    });

    const newInstanceId = game.players["0"].base.find((id) => game.instances[id].cardId === "sfd-98");
    expect(game.instances[newInstanceId!].statuses.buffed).toBeFalsy();
  });
});

describe("Blast Corps Cadet (sfd-13): pay 1 extra Energy to deal 2 on play", () => {
  it("deals 2 to a unit at a battlefield when the additional cost is paid", () => {
    const game = makeGame();
    const cadet = putOnBase(game, "sfd-13", "0");
    const target = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, target.instanceId, 0);
    cadet.statuses.paidAdditionalCostThisTurn = true;

    SpecialCaseEngine.onPlay(game, getCard(cadet.cardId), cadet);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("does nothing when not paid", () => {
    const game = makeGame();
    const cadet = putOnBase(game, "sfd-13", "0");
    const target = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, target.instanceId, 0);

    SpecialCaseEngine.onPlay(game, getCard(cadet.cardId), cadet);

    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Frostcoat Cub (sfd-67): pay Mind Rune (charged as 0 Energy) to weaken a unit on play", () => {
  it("gives -2 Might to another unit when the additional cost is paid", () => {
    const game = makeGame();
    const cub = putOnBase(game, "sfd-67", "0");
    const target = putOnBase(game, "unit-plain-footman", "1");
    cub.statuses.paidAdditionalCostThisTurn = true;

    SpecialCaseEngine.onPlay(game, getCard(cub.cardId), cub);

    expect(target.tempMightBonus).toBe(-2);
  });

  it("charges 0 Energy for the additional cost (Domain Rune not modeled)", () => {
    const game = makeGame();
    const cub = putOnBase(game, "sfd-67", "0");
    expect(SpecialCaseEngine.additionalPlayCostEnergy(game, getCard(cub.cardId), cub)).toBe(0);
  });
});
