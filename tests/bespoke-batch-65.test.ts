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

describe("Rek'Sai, Swarm Queen (sfd-170)", () => {
  it("plays the priciest revealed card and moves a played unit here, recycling the rest", () => {
    const game = makeGame();
    const reksai = putOnBattlefield(game, "sfd-170", "0", 1);
    game.players["0"].mainDeck = ["unit-blazing-scorcher", "unit-doomed-recruit"];
    const card = getCard(reksai.cardId);

    SpecialCaseEngine.onAttack(game, card, reksai);

    expect(game.players["0"].mainDeck).toEqual(["unit-doomed-recruit"]);
    const played = Object.values(game.instances).find(
      (i) => i.cardId === "unit-blazing-scorcher" && i.controller === "0" && i.instanceId !== reksai.instanceId,
    );
    expect(played).toBeDefined();
    expect(played!.zone).toBe("battlefield");
    expect(played!.battlefieldIndex).toBe(1);
  });
});

describe("Relentless Pursuit (sfd-184)", () => {
  it("moves a friendly unit to base and attaches an unattached friendly Equipment", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-184", "0");
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const gear = putOnBase(game, "sfd-161", "0"); // B.F. Sword, Equipment
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(unit.zone).toBe("base");
    expect(gear.attachedTo).toBe(unit.instanceId);
  });
});

describe("Resonating Strike (ven-34)", () => {
  it("moves a friendly unit to a controlled battlefield and gives it +2 Might", () => {
    const game = makeGame();
    game.battlefields[1].controller = "0";
    const spell = putOnBase(game, "ven-34", "0");
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(unit.zone).toBe("battlefield");
    expect(unit.battlefieldIndex).toBe(1);
    expect(unit.tempMightBonus).toBe(2);
  });
});

describe("Sacrifice (unl-173)", () => {
  it("kills the weakest Mighty friendly unit, draws 2, and channels 1 rune exhausted", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-173", "0");
    const mighty = putOnBase(game, "unit-blazing-scorcher", "0");
    mighty.tempMightBonus = 2; // pushes Might to 5, meets Mighty threshold
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-plain-footman"];
    const card = getCard(spell.cardId);
    const runeDeckBefore = game.players["0"].runeDeck.length;

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[mighty.instanceId]).toBeUndefined();
    expect(game.players["0"].hand.length).toBe(2);
    expect(game.players["0"].runeDeck.length).toBe(runeDeckBefore - 1);
    expect(game.players["0"].runePool.some((r) => r.exhausted)).toBe(true);
  });

  it("doesn't kill a non-Mighty unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-173", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[weak.instanceId]).toBeDefined();
  });
});

describe("no-op doc handlers (unwired mechanics)", () => {
  it("Rek'Sai, Breacher (sfd-29) registers without throwing", () => {
    const game = makeGame();
    const reksai = putOnBase(game, "sfd-29", "0");
    const card = getCard(reksai.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, reksai)).not.toThrow();
  });

  it("Ruin Runner (sfd-105) registers without throwing", () => {
    const game = makeGame();
    const ruinRunner = putOnBase(game, "sfd-105", "0");
    const card = getCard(ruinRunner.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, ruinRunner)).not.toThrow();
  });

  it("Rengar, Pouncing (sfd-25) registers without throwing", () => {
    const game = makeGame();
    const rengar = putOnBase(game, "sfd-25", "0");
    const card = getCard(rengar.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, rengar)).not.toThrow();
  });
});
