import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { battlefieldPseudoInstance } from "../src/game/pseudoInstance";
import { makeGame, putOnBase } from "./helpers";

function putOnBattlefield(game: ReturnType<typeof makeGame>, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Shadow Temple (ven-165)", () => {
  it("burns 3 cards from the holder's Main Deck at their Beginning step", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "ven-165", units: { "0": [], "1": [] }, controller: "0" };
    game.players["0"].mainDeck = ["unit-plain-footman", "unit-plain-guard", "gear-tactical-banner", "spell-dangerous-duo"];
    const card = getCard("ven-165");

    SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance("ven-165", "0", 0));

    expect(game.players["0"].trash).toEqual(["unit-plain-footman", "unit-plain-guard", "gear-tactical-banner"]);
    expect(game.players["0"].mainDeck).toEqual(["spell-dangerous-duo"]);
  });
});

describe("Patched Porobot (ven-58)", () => {
  it("draws a card only when the controller controls 3+ other gear", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const porobot = putOnBase(game, "ven-58", "0");
    const card = getCard(porobot.cardId);

    SpecialCaseEngine.onPlay(game, card, porobot);
    expect(game.players["0"].hand).toEqual([]);

    putOnBase(game, "gear-tactical-banner", "0");
    putOnBase(game, "gear-tactical-banner", "0");
    putOnBase(game, "gear-tactical-banner", "0");
    SpecialCaseEngine.onPlay(game, card, porobot);
    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
  });
});

describe("Renekton, Rage Fueled (ven-19)", () => {
  it("deals 2 to all enemy units here when attacking with 4 or fewer runes", () => {
    const game = makeGame();
    const renekton = putOnBattlefield(game, "ven-19", "0", 0);
    // unit-plain-footman (Might 2) and unit-plain-guard (Might 1) both die to 2 damage.
    const enemy1 = putOnBattlefield(game, "unit-plain-footman", "1", 0);
    const enemy2 = putOnBattlefield(game, "unit-plain-guard", "1", 0);
    const card = getCard(renekton.cardId);

    SpecialCaseEngine.onAttack(game, card, renekton);

    expect(game.instances[enemy1.instanceId]).toBeUndefined();
    expect(game.instances[enemy2.instanceId]).toBeUndefined();
    expect(game.battlefields[0].units["1"]).toEqual([]);
  });

  it("does nothing when controlling more than 4 runes", () => {
    const game = makeGame();
    const renekton = putOnBattlefield(game, "ven-19", "0", 0);
    game.players["0"].runePool = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `rune-${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));
    const enemy = putOnBattlefield(game, "unit-plain-footman", "1", 0);
    const card = getCard(renekton.cardId);

    SpecialCaseEngine.onAttack(game, card, renekton);

    expect(game.instances[enemy.instanceId].damage).toBe(0);
  });
});
