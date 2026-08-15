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

describe("Minah Swiftfoot (ven-111)", () => {
  it("draws 1 for both players when it moves to a battlefield", () => {
    const game = makeGame();
    const minah = putOnBattlefield(game, "ven-111", "0", 0);
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    game.players["1"].mainDeck = ["token-tentacle"];
    const card = getCard(minah.cardId);

    SpecialCaseEngine.onMove(game, card, minah);
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
    expect(game.players["1"].hand).toEqual(["token-tentacle"]);
  });
});

describe("Rocket Barrage (sfd-77)", () => {
  it("prefers killing an enemy gear over dealing damage", () => {
    const game = makeGame();
    const barrage = putOnBase(game, "sfd-77", "0");
    const gear = putOnBase(game, "gear-tactical-banner", "1");
    const unitInBase = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(barrage.cardId);

    SpecialCaseEngine.onPlay(game, card, barrage);
    expect(game.instances[gear.instanceId]).toBeUndefined();
    expect(game.instances[unitInBase.instanceId]).toBeDefined();
    expect(game.instances[unitInBase.instanceId].damage).toBe(0);
  });

  it("deals 4 to the strongest enemy unit it can kill in a base", () => {
    const game = makeGame();
    const barrage = putOnBase(game, "sfd-77", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "1");
    const strong = putOnBase(game, "unit-blazing-scorcher", "1");
    const card = getCard(barrage.cardId);

    SpecialCaseEngine.onPlay(game, card, barrage);
    expect(game.instances[strong.instanceId]).toBeUndefined();
    expect(game.instances[weak.instanceId]).toBeDefined();
  });

  it("ignores enemy units at a battlefield (only 'in a base' counts)", () => {
    const game = makeGame();
    const barrage = putOnBase(game, "sfd-77", "0");
    const atBattlefield = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(barrage.cardId);

    SpecialCaseEngine.onPlay(game, card, barrage);
    expect(game.instances[atBattlefield.instanceId]).toBeDefined();
    expect(game.instances[atBattlefield.instanceId].damage).toBe(0);
  });
});

describe("Piercing Light (sfd-23)", () => {
  it("deals 2 to the weakest enemy unit at a battlefield, then 2 to the weakest remaining enemy unit anywhere", () => {
    const game = makeGame();
    const light = putOnBase(game, "sfd-23", "0");
    const atBattlefield = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const inBase = putOnBase(game, "unit-blazing-scorcher", "1"); // Might 3
    const card = getCard(light.cardId);

    SpecialCaseEngine.onPlay(game, card, light);
    expect(game.instances[atBattlefield.instanceId]).toBeUndefined();
    expect(game.instances[inBase.instanceId]).toBeDefined();
    expect(game.instances[inBase.instanceId].damage).toBe(2);
  });

  it("only hits the primary target if no other enemy unit exists", () => {
    const game = makeGame();
    const light = putOnBase(game, "sfd-23", "0");
    const only = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(light.cardId);

    SpecialCaseEngine.onPlay(game, card, light);
    expect(game.instances[only.instanceId]).toBeUndefined();
  });
});
