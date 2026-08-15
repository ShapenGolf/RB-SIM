import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { computeMight } from "../src/game/might";
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

describe("Baccai Witherclaw (ven-78)", () => {
  it("has no Might bonus and no channel on death while not Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-78", "0");
    const card = getCard(unit.cardId);

    expect(computeMight(game, getCard, unit, "none")).toBe(card.might ?? 0);

    SpecialCaseEngine.onDestroy(game, card, unit);
    expect(game.players["0"].runePool).toHaveLength(0);
  });

  it("has +2 Might and channels 2 runes on death while Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-78", "0");
    unit.statuses.empowered = true;
    const card = getCard(unit.cardId);

    expect(computeMight(game, getCard, unit, "none")).toBe((card.might ?? 0) + 2);

    game.players["0"].runeDeck = [
      { instanceId: "rd0", domain: "Fury", exhausted: false },
      { instanceId: "rd1", domain: "Calm", exhausted: false },
    ];
    SpecialCaseEngine.onDestroy(game, card, unit);

    expect(game.players["0"].runePool).toHaveLength(2);
    expect(game.players["0"].runePool.every((r) => r.exhausted)).toBe(true);
  });
});

describe("Blood Money (sfd-162)", () => {
  it("plays 1 Gold gear token when killing an enemy unit with 2 Might or less", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const spell = putOnBase(game, "sfd-162", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokens).toHaveLength(1);
  });

  it("plays 2 Gold gear tokens when killing a friendly unit with 2 Might or less", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-doomed-recruit", "0"); // Might 1, needs to be at a battlefield
    target.zone = "battlefield";
    target.battlefieldIndex = 0;
    game.battlefields[0].units["0"].push(target.instanceId);
    const spell = putOnBase(game, "sfd-162", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokens).toHaveLength(2);
  });

  it("doesn't kill a unit with more than 2 Might", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const spell = putOnBase(game, "sfd-162", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Kennen, Storm of Shuriken (ven-113)", () => {
  it("burns 2 cards on play", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher", "gear-tactical-banner"];
    const kennen = putOnBase(game, "ven-113", "0");
    const card = getCard(kennen.cardId);

    SpecialCaseEngine.onPlay(game, card, kennen);

    expect(game.players["0"].trash).toEqual(["unit-doomed-recruit", "unit-blazing-scorcher"]);
    expect(game.players["0"].mainDeck).toEqual(["gear-tactical-banner"]);
  });
});

describe("Miss Fortune, Captain (ogn-162)", () => {
  it("readies another exhausted friendly card the first time it moves each turn", () => {
    const game = makeGame();
    const mf = putOnBattlefield(game, "ogn-162", "0", 0);
    const other = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const card = getCard(mf.cardId);

    SpecialCaseEngine.onMove(game, card, mf);

    expect(other.exhausted).toBe(false);
  });

  it("doesn't ready anything the second time it moves the same turn", () => {
    const game = makeGame();
    const mf = putOnBattlefield(game, "ogn-162", "0", 0);
    const other = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const card = getCard(mf.cardId);

    SpecialCaseEngine.onMove(game, card, mf);
    other.exhausted = true;
    SpecialCaseEngine.onMove(game, card, mf);

    expect(other.exhausted).toBe(true);
  });
});

describe("Ruthless Strike (ven-8)", () => {
  it("deals 3 without the additional cost", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const spell = putOnBase(game, "ven-8", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("deals 5 with the additional cost paid", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    target.tempMightBonus = 4; // Might 5, survives 3 but not 5
    const spell = putOnBase(game, "ven-8", "0");
    spell.statuses.paidAdditionalCostThisTurn = true;
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("doesn't kill a strong unit without the additional cost", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    target.tempMightBonus = 4; // Might 5
    const spell = putOnBase(game, "ven-8", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeDefined();
  });
});

describe("Mirror Image (unl-200)", () => {
  it("creates a Temporary copy of the target in base, ready", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-blazing-scorcher", "1");
    const spell = putOnBase(game, "unl-200", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    const copyId = game.players["0"].base.find((id) => game.instances[id].cardId === "unit-blazing-scorcher");
    expect(copyId).toBeDefined();
    const copy = game.instances[copyId!];
    expect(copy.exhausted).toBe(false);
    expect(copy.statuses.temporary).toBe(true);
    expect(copy.instanceId).not.toBe(target.instanceId);
  });
});
