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

describe("Death Mark (ven-144)", () => {
  it("burns 3 cards and plays a Shadow Clone token", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-144", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher", "unit-plain-footman", "unit-plain-guard"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].trash).toEqual(["unit-doomed-recruit", "unit-blazing-scorcher", "unit-plain-footman"]);
    expect(game.players["0"].mainDeck).toEqual(["unit-plain-guard"]);
    const token = Object.values(game.instances).find((i) => i.cardId === "token-shadow-clone" && i.controller === "0");
    expect(token).toBeDefined();
  });
});

describe("Deathgrip (sfd-163)", () => {
  it("kills the weakest friendly unit and gives its Might to the strongest remaining one, then draws 1", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-163", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const card = getCard(spell.cardId);
    const weakMight = getCard(weak.cardId).might ?? 0;

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[weak.instanceId]).toBeUndefined();
    expect(strong.tempMightBonus).toBe(weakMight);
    expect(game.players["0"].hand).toContain("unit-plain-footman");
  });
});

describe("Decree of Insight (ven-61)", () => {
  it("gives an enemy Body unit -5 Might this turn", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-61", "0");
    const target = putOnBase(game, "sfd-109", "1"); // Akshan, Mischievous — Body domain
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(target.tempMightBonus).toBe(-5);
  });

  it("doesn't affect a non-Body enemy unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-61", "0");
    const target = putOnBase(game, "ven-21", "1"); // Akali, Deadly Weapon — Fury domain
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(target.tempMightBonus).toBe(0);
  });
});

describe("Decree of Focus (ven-40)", () => {
  it("gives +4 Might to a friendly unit at a battlefield with an enemy Fury unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-40", "0");
    const friendly = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    putOnBattlefield(game, "ven-21", "1", 0); // Akali, Deadly Weapon — Fury domain
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(friendly.tempMightBonus).toBe(4);
  });

  it("doesn't affect a battlefield with no enemy Fury unit", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-40", "0");
    const friendly = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(friendly.tempMightBonus).toBe(0);
  });
});
