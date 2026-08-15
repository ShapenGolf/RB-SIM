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

describe("Sprite Call (ogn-94)", () => {
  it("plays a ready 3 Might Temporary Sprite token", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-94", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    const token = Object.values(game.instances).find((i) => i.cardId === "token-sprite-temporary" && i.controller === "0");
    expect(token).toBeDefined();
    expect(token!.exhausted).toBe(false);
  });
});

describe("Star-Crossed (unl-128)", () => {
  it("returns a friendly and an enemy unit to hand", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-128", "0");
    const friendly = putOnBase(game, "unit-doomed-recruit", "0");
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[friendly.instanceId]).toBeUndefined();
    expect(game.instances[enemy.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
    expect(game.players["1"].hand).toContain("unit-doomed-recruit");
  });
});

describe("Spiderling (ven-97)", () => {
  it("gains +1 Might for each other Spiderling at the same battlefield", () => {
    const game = makeGame();
    const s1 = putOnBattlefield(game, "ven-97", "0", 0);
    putOnBattlefield(game, "ven-97", "0", 0);
    putOnBattlefield(game, "ven-97", "0", 0);
    const card = getCard(s1.cardId);

    expect(SpecialCaseEngine.staticMightModifier(game, card, s1)).toBe(2);
  });

  it("doesn't count Spiderlings at a different battlefield", () => {
    const game = makeGame();
    const s1 = putOnBattlefield(game, "ven-97", "0", 0);
    putOnBattlefield(game, "ven-97", "0", 1);
    const card = getCard(s1.cardId);

    expect(SpecialCaseEngine.staticMightModifier(game, card, s1)).toBe(0);
  });
});

describe("Smoke and Mirrors (unl-83)", () => {
  it("swaps a Temporary unit with another friendly unit at a different location, then draws 1", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-83", "0");
    const temp = putOnBattlefield(game, "token-sprite-temporary", "0", 0);
    const other = putOnBattlefield(game, "unit-doomed-recruit", "0", 1);
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(temp.battlefieldIndex).toBe(1);
    expect(other.battlefieldIndex).toBe(0);
    expect(game.players["0"].hand).toContain("unit-plain-footman");
  });
});

describe("Stand United (ogn-53)", () => {
  it("buffs a friendly unit without a buff already", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-53", "0");
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(unit.statuses.buffed).toBe(true);
  });
});
