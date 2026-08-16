import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { attackBattlefield } from "../src/game/moves";
import { battlefieldPseudoInstance } from "../src/game/pseudoInstance";
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

describe("Reaver's Row (ogn-285)", () => {
  it("moves a defending friendly unit to base when the battlefield is attacked (real attackBattlefield flow)", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "ogn-285";
    game.battlefields[0].controller = "0";
    const defender = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const attacker = putOnBase(game, "unit-blazing-scorcher", "1", { exhausted: false });

    attackBattlefield(ctx(game, "1"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(defender.zone).toBe("base");
  });

  it("does nothing when the battlefield card isn't Reaver's Row", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    const defender = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const attacker = putOnBase(game, "unit-blazing-scorcher", "1", { exhausted: false });

    attackBattlefield(ctx(game, "1"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(defender.zone).toBe("battlefield");
  });
});

describe("no-op doc battlefield handlers", () => {
  it("The Candlelit Sanctum (ogn-291) registers without throwing", () => {
    const game = makeGame();
    const card = getCard("ogn-291");
    const pseudo = battlefieldPseudoInstance("ogn-291", "0", 0);
    expect(() => SpecialCaseEngine.onConquerHere(game, card, pseudo, [], 0)).not.toThrow();
  });

  it("Heisho, Shell of the World (ven-158) registers without throwing", () => {
    const game = makeGame();
    const heisho = putOnBase(game, "ven-158", "0");
    const card = getCard(heisho.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, heisho)).not.toThrow();
  });

  it("Threshold of the Gray (ven-166) registers without throwing", () => {
    const game = makeGame();
    const threshold = putOnBase(game, "ven-166", "0");
    const card = getCard(threshold.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, threshold)).not.toThrow();
  });

  it("The Academy (unl-216) registers without throwing", () => {
    const game = makeGame();
    const academy = putOnBase(game, "unl-216", "0");
    const card = getCard(academy.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, academy)).not.toThrow();
  });
});
