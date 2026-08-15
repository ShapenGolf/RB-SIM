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

describe("Teemo, Strategist reprint (ogn-121)", () => {
  it("shares the same handler as sfd-230", () => {
    expect(getCard("ogn-121").specialCaseId).toBe(getCard("sfd-230").specialCaseId);
  });
});

describe("Wages of Pain (sfd-70)", () => {
  it("deals 3 to the strongest enemy unit and plays an exhausted Gold gear token", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-70", "0");
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.damage).toBe(3);
    const token = Object.values(game.instances).find((i) => i.cardId === "token-gold-gear" && i.controller === "0");
    expect(token).toBeDefined();
    expect(token!.exhausted).toBe(true);
  });
});

describe("Whirlwind (ogn-187)", () => {
  it("returns both players' weakest units to hand", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-187", "0");
    const mine = putOnBase(game, "unit-doomed-recruit", "0");
    const theirs = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[mine.instanceId]).toBeUndefined();
    expect(game.instances[theirs.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
    expect(game.players["1"].hand).toContain("unit-doomed-recruit");
  });
});

describe("Wild Claw (ven-89)", () => {
  it("plays the priciest eligible card from the top 5 ignoring cost and empowers it", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-89", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher", "unit-plain-footman", "unit-plain-guard", "spell-stunning-blow"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    const played = Object.values(game.instances).find(
      (i) => i.cardId === "unit-blazing-scorcher" && i.controller === "0",
    );
    expect(played).toBeDefined();
    expect(played!.statuses.empowered).toBe(true);
    expect(game.players["0"].mainDeck.length).toBe(4);
  });
});

describe("Windsinger (sfd-138)", () => {
  it("returns an eligible enemy unit (Might <= 3) at a battlefield to hand", () => {
    const game = makeGame();
    const windsinger = putOnBattlefield(game, "sfd-138", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(windsinger.cardId);

    SpecialCaseEngine.onPlay(game, card, windsinger);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toContain("unit-doomed-recruit");
  });

  it("doesn't return a unit above the Might cap", () => {
    const game = makeGame();
    const windsinger = putOnBattlefield(game, "sfd-138", "0", 0);
    const enemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3, boosted above cap
    enemy.tempMightBonus = 1;
    const card = getCard(windsinger.cardId);

    SpecialCaseEngine.onPlay(game, card, windsinger);

    expect(game.instances[enemy.instanceId]).toBeDefined();
  });
});
