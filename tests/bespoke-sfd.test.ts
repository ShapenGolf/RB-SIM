import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { destroyInstance } from "../src/game/combat";
import { resolveOptionalCost } from "../src/game/moves";
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
