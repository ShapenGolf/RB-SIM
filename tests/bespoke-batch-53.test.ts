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

describe("Blast Cone (unl-133)", () => {
  it("moves an enemy unit to base and stuns it, then exhausts itself", () => {
    const game = makeGame();
    const cone = putOnBase(game, "unl-133", "0");
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(cone.cardId);

    SpecialCaseEngine.onPlay(game, card, cone);

    expect(enemy.zone).toBe("base");
    expect(enemy.statuses.stunned).toBe(true);
    expect(cone.exhausted).toBe(true);
  });
});

describe("Block (ogn-57)", () => {
  it("grants Shield 3 and Tank this turn to the controller's weakest unit", () => {
    const game = makeGame();
    const blockInstance = putOnBase(game, "ogn-57", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const card = getCard(blockInstance.cardId);

    SpecialCaseEngine.onPlay(game, card, blockInstance);

    expect(weak.grantedThisTurn).toContainEqual({ keyword: "shield", value: 3 });
    expect(weak.grantedThisTurn).toContainEqual({ keyword: "tank" });
    expect(strong.grantedThisTurn).toEqual([]);
  });
});

describe("Bellows Breath (sfd-80)", () => {
  it("deals 1 to up to 3 enemy units at the battlefield with the most enemies", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-80", "0");
    const e1 = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const e2 = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const soloEnemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 1);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(e1.damage).toBe(1);
    expect(e2.damage).toBe(1);
    expect(soloEnemy.damage).toBe(0);
  });
});

describe("Ava Achiever (ogn-107)", () => {
  it("plays a Hidden unit from hand to the attacked battlefield, ignoring its cost", () => {
    const game = makeGame();
    const ava = putOnBattlefield(game, "ogn-107", "0", 0);
    game.players["0"].hand = ["ogn-97"]; // Blastcone Fae, has Hidden
    const card = getCard(ava.cardId);

    SpecialCaseEngine.onAttack(game, card, ava);

    expect(game.players["0"].hand).not.toContain("ogn-97");
    const played = Object.values(game.instances).find((i) => i.cardId === "ogn-97" && i.controller === "0");
    expect(played).toBeDefined();
    expect(played!.zone).toBe("battlefield");
    expect(played!.battlefieldIndex).toBe(0);
  });

  it("does nothing if no Hidden card is in hand", () => {
    const game = makeGame();
    const ava = putOnBattlefield(game, "ogn-107", "0", 0);
    game.players["0"].hand = ["unit-doomed-recruit"];
    const card = getCard(ava.cardId);

    expect(() => SpecialCaseEngine.onAttack(game, card, ava)).not.toThrow();
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
  });
});

describe("Baron Nashor (unl-147 / unl-238)", () => {
  it("gives other friendly units +2 Might", () => {
    const game = makeGame();
    putOnBase(game, "unl-147", "0");
    const ally = putOnBase(game, "unit-doomed-recruit", "0");
    expect(SpecialCaseEngine.staticMightModifierFromAllies(game, getCard, ally)).toBe(2);
  });

  it("shares the same handler between both reprints", () => {
    expect(getCard("unl-147").specialCaseId).toBe(getCard("unl-238").specialCaseId);
  });
});
