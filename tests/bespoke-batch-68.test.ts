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

describe("Sudden Storm (sfd-17)", () => {
  it("deals 2 to the strongest enemy unit at a battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-17", "0");
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.damage).toBe(2);
  });
});

describe("Switcheroo (sfd-145)", () => {
  it("swaps the Might of the two strongest units at the busiest battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-145", "0");
    const strong = putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    const weak = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(spell.cardId);
    const strongMight = getCard(strong.cardId).might ?? 0;
    const weakMight = getCard(weak.cardId).might ?? 0;

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(strong.tempMightBonus).toBe(weakMight - strongMight);
    expect(weak.tempMightBonus).toBe(strongMight - weakMight);
  });
});

describe("Temporal Breach (ven-66)", () => {
  it("banishes an enemy unit and replays it to the same battlefield, ignoring cost", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-66", "0");
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 1);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
    const replayed = Object.values(game.instances).find(
      (i) => i.cardId === "unit-blazing-scorcher" && i.controller === "1",
    );
    expect(replayed).toBeDefined();
    expect(replayed!.zone).toBe("battlefield");
    expect(replayed!.battlefieldIndex).toBe(1);
    expect(game.players["1"].banishment).not.toContain("unit-blazing-scorcher");
  });
});

describe("Temptation (sfd-129)", () => {
  it("moves an enemy unit to a battlefield where another enemy unit already is", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-129", "0");
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const mover = putOnBattlefield(game, "unit-doomed-recruit", "1", 1);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(mover.battlefieldIndex).toBe(0);
  });
});

describe("Thwonk! (sfd-40)", () => {
  it("stuns an enemy unit at a battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-40", "0");
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.statuses.stunned).toBe(true);
  });
});

describe("Tideturner (ogn-199)", () => {
  it("swaps locations with another friendly unit at a battlefield", () => {
    const game = makeGame();
    const tideturner = putOnBase(game, "ogn-199", "0");
    const other = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const card = getCard(tideturner.cardId);

    SpecialCaseEngine.onPlay(game, card, tideturner);

    expect(tideturner.zone).toBe("battlefield");
    expect(tideturner.battlefieldIndex).toBe(0);
    expect(other.zone).toBe("base");
  });
});

describe("Tornado Warrior (ven-99)", () => {
  it("empowers the strongest friendly unit here and queues a disempower at end of turn", () => {
    const game = makeGame();
    const warrior = putOnBattlefield(game, "ven-99", "0", 0);
    const ally = putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    const card = getCard(warrior.cardId);

    SpecialCaseEngine.onPlay(game, card, warrior);

    expect(ally.statuses.empowered).toBe(true);
    expect(game.pendingDisempowerAtEndOfTurn).toContain(ally.instanceId);
  });
});

describe("Temporal Portal (sfd-78)", () => {
  it("registers with a no-op handler (Repeat isn't wired)", () => {
    const game = makeGame();
    const portal = putOnBase(game, "sfd-78", "0");
    const card = getCard(portal.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, portal)).not.toThrow();
  });
});
