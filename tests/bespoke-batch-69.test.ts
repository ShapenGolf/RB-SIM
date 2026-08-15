import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { dealSpellDamage } from "../src/game/spellDamage";
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

describe("Unyielding Spirit (ogn-145)", () => {
  it("prevents all spell damage for the rest of the turn", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-145", "0");
    const card = getCard(spell.cardId);
    const target = putOnBase(game, "unit-doomed-recruit", "1");

    SpecialCaseEngine.onPlay(game, card, spell);
    dealSpellDamage(game, getCard, target.instanceId, 5, "0");

    expect(target.damage).toBe(0);
  });

  it("doesn't affect damage before it's played", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-doomed-recruit", "1");
    dealSpellDamage(game, getCard, target.instanceId, 5, "0");
    expect(target.damage).toBe(5);
  });
});

describe("Teemo, Strategist (sfd-230)", () => {
  it("deals damage equal to the number of Hidden cards revealed to an enemy unit here", () => {
    const game = makeGame();
    const teemo = putOnBattlefield(game, "sfd-230", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    game.players["0"].mainDeck = ["ogn-97", "unit-doomed-recruit", "ogn-97", "unit-plain-footman", "unit-plain-guard"];
    const card = getCard(teemo.cardId);

    SpecialCaseEngine.onDefend(game, card, teemo);

    expect(enemy.damage).toBe(2);
    expect(game.players["0"].mainDeck.length).toBe(5);
  });
});

describe("Tricksy Tentacles (unl-54)", () => {
  it("moves enemy units within the Might budget to a single location", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-54", "0");
    game.battlefields[1].controller = "0";
    const e1 = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const e2 = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(e1.battlefieldIndex).toBe(1);
    expect(e2.battlefieldIndex).toBe(1);
  });
});

describe("Udyr, Wildman (ogn-157)", () => {
  it("deals 2 to the strongest enemy unit at a battlefield when the buff is spent", () => {
    const game = makeGame();
    const udyr = putOnBase(game, "ogn-157", "0");
    udyr.statuses.buffed = true;
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(udyr.cardId);

    SpecialCaseEngine.onActivate(game, card, udyr);

    expect(enemy.damage).toBe(2);
  });
});

describe("Void Drone (sfd-10)", () => {
  it("registers with a no-op handler (play-source tracking isn't wired)", () => {
    const game = makeGame();
    const drone = putOnBase(game, "sfd-10", "0");
    const card = getCard(drone.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, drone)).not.toThrow();
  });
});
