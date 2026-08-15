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

describe("Noxian Guillotine (ogn-254)", () => {
  it("kills the strongest enemy unit immediately if another card was played this turn (Legion)", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-254", "0");
    game.players["0"].cardsPlayedThisTurn = 1;
    const enemy = putOnBase(game, "unit-blazing-scorcher", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });

  it("does nothing (documented gap) without the Legion condition", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-254", "0");
    const enemy = putOnBase(game, "unit-blazing-scorcher", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[enemy.instanceId]).toBeDefined();
  });
});

describe("Overzealous Fan (sfd-128)", () => {
  it("kills itself to move an attacking unit to base", () => {
    const game = makeGame();
    const fan = putOnBattlefield(game, "sfd-128", "0", 0);
    const attacker = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(fan.cardId);

    SpecialCaseEngine.onDefend(game, card, fan);

    expect(game.instances[fan.instanceId]).toBeUndefined();
    expect(attacker.zone).toBe("base");
  });
});

describe("Pyke, Dockside Butcher (unl-28)", () => {
  it("enters ready and gains +2 Might when the additional cost is paid", () => {
    const game = makeGame();
    const pyke = putOnBase(game, "unl-28", "0");
    pyke.statuses.paidAdditionalCostThisTurn = true;
    const card = getCard(pyke.cardId);

    expect(SpecialCaseEngine.selfEntersReady(game, card, pyke)).toBe(true);
    SpecialCaseEngine.onPlay(game, card, pyke);
    expect(pyke.tempMightBonus).toBe(2);
  });

  it("stays exhausted without the additional cost", () => {
    const game = makeGame();
    const pyke = putOnBase(game, "unl-28", "0");
    const card = getCard(pyke.cardId);
    expect(SpecialCaseEngine.selfEntersReady(game, card, pyke)).toBe(false);
  });
});

describe("Questionable Tome (ven-54)", () => {
  it("draws 1 and disempowers when activated while Empowered", () => {
    const game = makeGame();
    const tome = putOnBase(game, "ven-54", "0");
    tome.statuses.empowered = true;
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(tome.cardId);

    SpecialCaseEngine.onActivate(game, card, tome);

    expect(tome.statuses.empowered).toBe(false);
    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
  });

  it("does nothing if not Empowered", () => {
    const game = makeGame();
    const tome = putOnBase(game, "ven-54", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(tome.cardId);

    SpecialCaseEngine.onActivate(game, card, tome);

    expect(game.players["0"].hand).toEqual([]);
  });
});
