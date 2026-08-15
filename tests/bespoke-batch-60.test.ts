import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Fox-Fire (ogn-256)", () => {
  it("kills the most units at a battlefield within the 4 Might budget", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-256", "0");
    const r1 = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const r2 = putOnBattlefield(game, "unit-doomed-recruit", "0", 0); // Might 1
    const scorcher = putOnBattlefield(game, "unit-blazing-scorcher", "1", 1); // Might 3, alone
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[r1.instanceId]).toBeUndefined();
    expect(game.instances[r2.instanceId]).toBeUndefined();
    expect(game.instances[scorcher.instanceId]).toBeDefined();
  });
});

describe("Hextech Formula (ven-62)", () => {
  it("empowers another friendly gear on activation", () => {
    const game = makeGame();
    const formula = putOnBase(game, "ven-62", "0");
    const other = putOnBase(game, "sfd-169", "0"); // Altar of Memories, a gear
    const card = getCard(formula.cardId);

    SpecialCaseEngine.onActivate(game, card, formula);

    expect(other.statuses.empowered).toBe(true);
  });
});

describe("Hextech Disc (ven-87)", () => {
  it("plays a 3 Might Mech token when Empowered, then disempowers itself", () => {
    const game = makeGame();
    const disc = putOnBase(game, "ven-87", "0");
    disc.statuses.empowered = true;
    const card = getCard(disc.cardId);

    SpecialCaseEngine.onActivate(game, card, disc);

    expect(disc.statuses.empowered).toBe(false);
    const token = Object.values(game.instances).find((i) => i.cardId === "token-mech-3" && i.controller === "0");
    expect(token).toBeDefined();
  });

  it("does nothing if not Empowered", () => {
    const game = makeGame();
    const disc = putOnBase(game, "ven-87", "0");
    const card = getCard(disc.cardId);

    SpecialCaseEngine.onActivate(game, card, disc);

    const token = Object.values(game.instances).find((i) => i.cardId === "token-mech-3" && i.controller === "0");
    expect(token).toBeUndefined();
  });
});

describe("Iascylla (unl-50)", () => {
  it("moves an enemy unit to her battlefield on hold", () => {
    const game = makeGame();
    const iascylla = putOnBattlefield(game, "unl-50", "0", 0);
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(iascylla.cardId);

    SpecialCaseEngine.onHold(game, card, iascylla);

    expect(enemy.zone).toBe("battlefield");
    expect(enemy.battlefieldIndex).toBe(0);
  });
});

describe("Icevale Archer (unl-65)", () => {
  it("offers a 1-Energy optional cost on attack", () => {
    const game = makeGame();
    const archer = putOnBattlefield(game, "unl-65", "0", 0);
    const card = getCard(archer.cardId);

    SpecialCaseEngine.onAttack(game, card, archer);

    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "icevale-archer",
      cost: { energy: 1 },
      payload: "0",
    });
  });

  it("gives the strongest enemy unit here -1 Might once paid", () => {
    const game = makeGame();
    putOnBattlefield(game, "unl-65", "0", 0);
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);

    SpecialCaseEngine.onOptionalCostPaid(game, "icevale-archer", "0", "0");

    expect(enemy.tempMightBonus).toBe(-1);
  });
});

describe("Hostile Takeover (sfd-202)", () => {
  it("takes control of an enemy unit at a battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-202", "0");
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, enemy.instanceId);

    expect(enemy.controller).toBe("0");
    expect(game.battlefields[0].units["0"]).toContain(enemy.instanceId);
    expect(game.battlefields[0].units["1"]).not.toContain(enemy.instanceId);
  });
});
