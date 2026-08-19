import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { endTurn } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID, events: { endTurn: () => {} } } as unknown as FnContext<GameState> & { playerID: string };
}

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Scryer's Bloom (unl-136)", () => {
  it("kills itself, sets pendingPredict, draws 1, and gains 1 XP", () => {
    const game = makeGame();
    const gear = putOnBase(game, "unl-136", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(gear.cardId);

    SpecialCaseEngine.onActivate(game, card, gear);

    expect(game.players["0"].pendingPredict).toBe(2);
    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
    expect(game.players["0"].xp).toBe(1);
  });
});

describe("Shadow Dash (ven-148)", () => {
  it("moves an enemy unit to a friendly battlefield and buffs both friendly units if exactly 2 are there", () => {
    const game = makeGame();
    const dash = putOnBase(game, "ven-148", "0");
    const friendly1 = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const friendly2 = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 1);
    const card = getCard(dash.cardId);

    SpecialCaseEngine.onPlay(game, card, dash);

    expect(enemy.zone).toBe("battlefield");
    expect(enemy.battlefieldIndex).toBe(0);
    expect(friendly1.tempMightBonus).toBe(1);
    expect(friendly2.tempMightBonus).toBe(1);
  });
});

describe("Shakedown (ogn-33)", () => {
  it("deals 6 to the strongest enemy unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-33", "0");
    const enemy = putOnBase(game, "unit-blazing-scorcher", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.damage).toBe(6);
  });
});

describe("Show of Strength (sfd-106)", () => {
  it("draws 1 for each Mighty friendly unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-106", "0");
    const mighty = putOnBase(game, "unit-blazing-scorcher", "0");
    mighty.tempMightBonus = 2; // total Might 5
    putOnBase(game, "unit-doomed-recruit", "0"); // not Mighty
    game.players["0"].mainDeck = ["unit-plain-footman", "unit-plain-guard"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand.length).toBe(1);
  });
});

describe("Shuriken Flip (ven-140)", () => {
  it("deals 2 to an enemy unit and moves a friendly unit to base", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-140", "0");
    const friendly = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.damage).toBe(2);
    expect(friendly.zone).toBe("base");
  });
});

describe("Siphon Power (ogn-266)", () => {
  it("buffs friendly units and debuffs enemy units at the battlefield with the most enemies", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-266", "0");
    const friendly = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(friendly.tempMightBonus).toBe(1);
    expect(enemy.tempMightBonus).toBe(-1);
  });

  it("doesn't drop an enemy unit below 1 Might", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-266", "0");
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.tempMightBonus).toBe(0);
  });
});

describe("Sanction (ven-35)", () => {
  it("empowers the strongest non-Empowered friendly unit and queues a disempower at end of turn", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-35", "0");
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(unit.statuses.empowered).toBe(true);
    expect(game.pendingDisempowerAtEndOfTurn).toContain(unit.instanceId);
  });

  it("disempowers the queued unit when the turn ends", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    unit.statuses.empowered = true;
    game.pendingDisempowerAtEndOfTurn.push(unit.instanceId);

    endTurn(ctx(game, "0"));

    expect(unit.statuses.empowered).toBe(false);
    expect(game.pendingDisempowerAtEndOfTurn).toEqual([]);
  });
});
