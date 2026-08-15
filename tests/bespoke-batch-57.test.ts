import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { attackBattlefield } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Diana, Lunari (unl-79)", () => {
  it("offers a 1-Energy optional cost when a showdown begins at her battlefield", () => {
    const game = makeGame();
    putOnBattlefield(game, "unl-79", "1", 0);
    const attacker = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: false });

    attackBattlefield(ctx(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(game.pendingOptionalCost).toEqual({ playerId: "1", specialCaseId: "diana-lunari", cost: { energy: 1 }, payload: undefined });
  });

  it("draws the top card if it's a spell after the cost is paid", () => {
    const game = makeGame();
    putOnBase(game, "unl-79", "0");
    game.players["0"].mainDeck = ["spell-stunning-blow"];

    SpecialCaseEngine.onOptionalCostPaid(game, "diana-lunari", "0");

    expect(game.players["0"].hand).toContain("spell-stunning-blow");
  });

  it("doesn't draw if the top card isn't a spell", () => {
    const game = makeGame();
    putOnBase(game, "unl-79", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];

    SpecialCaseEngine.onOptionalCostPaid(game, "diana-lunari", "0");

    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].mainDeck).toEqual(["unit-doomed-recruit"]);
  });
});

describe("Defiant Dance (sfd-196)", () => {
  it("gives a friendly unit +2 Might and an enemy unit -2 Might", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-196", "0");
    const friendly = putOnBase(game, "unit-doomed-recruit", "0");
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(friendly.tempMightBonus).toBe(2);
    expect(enemy.tempMightBonus).toBe(-2);
  });
});

describe("Disciple of Shen (ven-117)", () => {
  it("has Shield 3 while at a battlefield with exactly one other friendly unit", () => {
    const game = makeGame();
    const disciple = putOnBattlefield(game, "ven-117", "0", 0);
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const card = getCard(disciple.cardId);

    expect(SpecialCaseEngine.defendingMightModifier(game, card, disciple)).toBe(3);
  });

  it("has no Shield with zero or 2+ other friendly units here", () => {
    const game = makeGame();
    const disciple = putOnBattlefield(game, "ven-117", "0", 0);
    const card = getCard(disciple.cardId);
    expect(SpecialCaseEngine.defendingMightModifier(game, card, disciple)).toBe(0);

    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    expect(SpecialCaseEngine.defendingMightModifier(game, card, disciple)).toBe(0);
  });
});

describe("Disposal Order (unl-103)", () => {
  it("draws 1", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-103", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
  });
});

describe("Dominus (ven-142)", () => {
  it("doubles the strongest friendly unit's Might", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-142", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const card = getCard(spell.cardId);
    const baseMight = getCard(strong.cardId).might ?? 0;

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(strong.tempMightBonus).toBe(baseMight);
  });
});

describe("Double Trouble (unl-32)", () => {
  it("draws a unit from the top 3 and recycles the rest", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-32", "0");
    game.players["0"].mainDeck = ["spell-stunning-blow", "unit-doomed-recruit", "unit-blazing-scorcher"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
    expect(game.players["0"].mainDeck).toEqual(["spell-stunning-blow", "unit-blazing-scorcher"]);
  });

  it("draws nothing if no unit is among the top 3", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-32", "0");
    game.players["0"].mainDeck = ["spell-stunning-blow"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].mainDeck).toEqual(["spell-stunning-blow"]);
  });
});
