import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { attachEquipment } from "../src/game/equip";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("Akshan, Mischievous (sfd-109)", () => {
  it("moves an enemy gear to base control when the additional cost was paid", () => {
    const game = makeGame();
    const akshan = putOnBase(game, "sfd-109", "0");
    const enemyGear = putOnBase(game, "sfd-169", "1"); // Altar of Memories, not an Equipment
    akshan.statuses.paidAdditionalCostThisTurn = true;
    const card = getCard(akshan.cardId);

    SpecialCaseEngine.onPlay(game, card, akshan);

    expect(enemyGear.controller).toBe("0");
    expect(game.players["0"].base).toContain(enemyGear.instanceId);
    expect(game.players["1"].base).not.toContain(enemyGear.instanceId);
  });

  it("attaches the moved gear if it's an Equipment", () => {
    const game = makeGame();
    const akshan = putOnBase(game, "sfd-109", "0");
    const enemyEquipment = putOnBase(game, "sfd-161", "1"); // B.F. Sword, has equipCost
    akshan.statuses.paidAdditionalCostThisTurn = true;
    const card = getCard(akshan.cardId);

    SpecialCaseEngine.onPlay(game, card, akshan);

    expect(enemyEquipment.attachedTo).toBe(akshan.instanceId);
    expect(akshan.equipment).toContain(enemyEquipment.instanceId);
  });

  it("does nothing if the additional cost wasn't paid", () => {
    const game = makeGame();
    const akshan = putOnBase(game, "sfd-109", "0");
    const enemyGear = putOnBase(game, "sfd-161", "1");
    const card = getCard(akshan.cardId);

    SpecialCaseEngine.onPlay(game, card, akshan);

    expect(enemyGear.controller).toBe("1");
  });
});

describe("Angle Shot (sfd-11)", () => {
  it("detaches an enemy's Equipment when one is attached", () => {
    const game = makeGame();
    const shot = putOnBase(game, "sfd-11", "0");
    const enemyUnit = putOnBase(game, "unit-plain-footman", "1");
    const enemyGear = putOnBase(game, "sfd-161", "1");
    attachEquipment(game, getCard, enemyGear.instanceId, enemyUnit.instanceId);
    const card = getCard(shot.cardId);
    const handSizeBefore = game.players["0"].hand.length;

    SpecialCaseEngine.onPlay(game, card, shot);

    expect(enemyGear.attachedTo).toBeNull();
    expect(enemyUnit.equipment).not.toContain(enemyGear.instanceId);
    expect(game.players["0"].hand.length).toBe(handSizeBefore + 1);
  });

  it("attaches a friendly unattached Equipment when no enemy Equipment is attached", () => {
    const game = makeGame();
    const shot = putOnBase(game, "sfd-11", "0");
    const friendlyUnit = putOnBase(game, "unit-plain-footman", "0");
    const friendlyGear = putOnBase(game, "sfd-161", "0");
    const card = getCard(shot.cardId);

    SpecialCaseEngine.onPlay(game, card, shot);

    expect(friendlyGear.attachedTo).toBe(friendlyUnit.instanceId);
  });
});

describe("Aphelios, Exalted (sfd-224 / sfd-49)", () => {
  it("readies 2 exhausted runes when an Equipment is attached", () => {
    const game = makeGame();
    const aphelios = putOnBase(game, "sfd-224", "0");
    game.players["0"].runePool.push(
      { instanceId: "r0", domain: "Mind", exhausted: true },
      { instanceId: "r1", domain: "Fury", exhausted: true },
      { instanceId: "r2", domain: "Mind", exhausted: true },
    );
    const gear = putOnBase(game, "sfd-161", "0");

    attachEquipment(game, getCard, gear.instanceId, aphelios.instanceId);

    const readied = game.players["0"].runePool.filter((r) => !r.exhausted);
    expect(readied.length).toBe(2);
  });

  it("shares the same handler between both reprints", () => {
    expect(getCard("sfd-224").specialCaseId).toBe(getCard("sfd-49").specialCaseId);
  });
});

describe("Apprentice Mage (ven-47)", () => {
  it("sets pendingPredict when it becomes Empowered", () => {
    const game = makeGame();
    const mage = putOnBase(game, "ven-47", "0");
    const card = getCard(mage.cardId);
    SpecialCaseEngine.onBecomeEmpowered(game, card, mage);
    expect(game.players["0"].pendingPredict).toBe(2);
  });

  it("has +1 Might while Empowered", () => {
    const game = makeGame();
    const mage = putOnBase(game, "ven-47", "0");
    const card = getCard(mage.cardId);
    expect(SpecialCaseEngine.staticMightModifier(game, card, mage)).toBe(0);
    mage.statuses.empowered = true;
    expect(SpecialCaseEngine.staticMightModifier(game, card, mage)).toBe(1);
  });
});

describe("Astral Heron (ven-44)", () => {
  it("reduces the cost of the next card played after the controller's first card each turn, if at a battlefield", () => {
    const game = makeGame();
    const heron = putOnBase(game, "ven-44", "0");
    heron.zone = "battlefield";
    heron.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(heron.instanceId);
    const otherCard = getCard("unit-doomed-recruit");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", otherCard, 1);

    expect(game.players["0"].nextCardCostReduction).toBe(2);
  });

  it("doesn't trigger on the second card played that turn", () => {
    const game = makeGame();
    const heron = putOnBase(game, "ven-44", "0");
    heron.zone = "battlefield";
    heron.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(heron.instanceId);
    const otherCard = getCard("unit-doomed-recruit");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", otherCard, 2);

    expect(game.players["0"].nextCardCostReduction).toBe(0);
  });

  it("reduces the Energy needed to play the next card via playCard", () => {
    const game = makeGame();
    game.players["0"].nextCardCostReduction = 2;
    game.players["0"].hand = ["unit-doomed-recruit"]; // energyCost 1, fully covered by the 2-reduction

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: [],
      powerRuneIds: [],
    });
    expect(result).toBeUndefined();
    expect(game.players["0"].nextCardCostReduction).toBe(0);
  });
});

describe("Azir, Sovereign (sfd-177)", () => {
  it("moves friendly token units to the battlefield it's attacking from", () => {
    const game = makeGame();
    const azir = putOnBase(game, "sfd-177", "0");
    azir.zone = "battlefield";
    azir.battlefieldIndex = 1;
    game.battlefields[1].units["0"].push(azir.instanceId);
    const token = putOnBase(game, "token-sprite-temporary", "0");
    const card = getCard(azir.cardId);

    SpecialCaseEngine.onAttack(game, card, azir);

    expect(token.zone).toBe("battlefield");
    expect(token.battlefieldIndex).toBe(1);
    expect(game.battlefields[1].units["0"]).toContain(token.instanceId);
  });
});

describe("Allay, Eager Admirer (unl-41)", () => {
  it("registers with a no-op handler (Deflect enforcement isn't wired anywhere in the engine)", () => {
    const game = makeGame();
    const allay = putOnBase(game, "unl-41", "0");
    const card = getCard(allay.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, allay)).not.toThrow();
  });
});
