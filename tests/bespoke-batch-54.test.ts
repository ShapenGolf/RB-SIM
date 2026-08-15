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

describe("Against the Odds (sfd-1)", () => {
  it("gives +2 Might per enemy unit at the same battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-1", "0");
    const friendly = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(friendly.tempMightBonus).toBe(4);
  });
});

describe("Back Off (unl-42)", () => {
  it("stuns the strongest enemy unit and draws 1", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-42", "0");
    putOnBase(game, "unit-doomed-recruit", "1");
    const strong = putOnBase(game, "unit-blazing-scorcher", "1");
    const card = getCard(spell.cardId);
    const handBefore = game.players["0"].hand.length;

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(strong.statuses.stunned).toBe(true);
    expect(game.players["0"].hand.length).toBe(handBefore + 1);
  });
});

describe("Bonds of Strength (sfd-151)", () => {
  it("gives +1 Might to two friendly units", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-151", "0");
    const u1 = putOnBase(game, "unit-doomed-recruit", "0");
    const u2 = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(u1.tempMightBonus).toBe(1);
    expect(u2.tempMightBonus).toBe(1);
  });
});

describe("Blood Rose (unl-109)", () => {
  it("offers to gain 1 XP when a unit is played", () => {
    const game = makeGame();
    const rose = putOnBase(game, "unl-109", "0");
    const unitCard = getCard("unit-doomed-recruit");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", unitCard, 1);

    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "blood-rose",
      cost: { energy: 1 },
      payload: rose.instanceId,
    });
    game.pendingOptionalCost = null;
    SpecialCaseEngine.onOptionalCostPaid(game, "blood-rose", "0", rose.instanceId);
    expect(rose.xp).toBe(1);
  });

  it("readies a unit for 3 XP, exhausting itself", () => {
    const game = makeGame();
    const rose = putOnBase(game, "unl-109", "0");
    rose.xp = 3;
    const target = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const card = getCard(rose.cardId);

    SpecialCaseEngine.onActivate(game, card, rose, target.instanceId);

    expect(target.exhausted).toBe(false);
  });
});

describe("Bushwhack (sfd-4)", () => {
  it("makes friendly units enter ready this turn and plays an exhausted Gold gear token", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-4", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].unitsEnterReadyThisTurn).toBe(true);
    const token = Object.values(game.instances).find((i) => i.cardId === "token-gold-gear" && i.controller === "0");
    expect(token).toBeDefined();
    expect(token!.exhausted).toBe(true);
  });
});

describe("Call to Battle (unl-101)", () => {
  it("moves a friendly unit and forces an enemy unit to the same controlled battlefield", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    const spell = putOnBase(game, "unl-101", "0");
    const myUnit = putOnBase(game, "unit-doomed-recruit", "0");
    const enemyUnit = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(myUnit.zone).toBe("battlefield");
    expect(myUnit.battlefieldIndex).toBe(0);
    expect(enemyUnit.zone).toBe("battlefield");
    expect(enemyUnit.battlefieldIndex).toBe(0);
  });
});

describe("Bard, Mercurial (sfd-228 / sfd-79)", () => {
  it("exhausts the legend and moves all units to an open battlefield when the additional cost was paid", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-17", exhausted: false };
    const bard = putOnBase(game, "sfd-228", "0");
    bard.statuses.paidAdditionalCostThisTurn = true;
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(bard.cardId);

    SpecialCaseEngine.onPlay(game, card, bard);

    expect(game.players["0"].legend!.exhausted).toBe(true);
    expect(unit.zone).toBe("battlefield");
  });

  it("does nothing if the additional cost wasn't paid", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-17", exhausted: false };
    const bard = putOnBase(game, "sfd-228", "0");
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(bard.cardId);

    SpecialCaseEngine.onPlay(game, card, bard);

    expect(game.players["0"].legend!.exhausted).toBe(false);
    expect(unit.zone).toBe("base");
  });

  it("shares the same handler between both reprints", () => {
    expect(getCard("sfd-228").specialCaseId).toBe(getCard("sfd-79").specialCaseId);
  });
});

describe("Blue Sentinel (unl-87)", () => {
  it("registers with a no-op handler (Add and hold-doubling aren't wired)", () => {
    const game = makeGame();
    const sentinel = putOnBase(game, "unl-87", "0");
    const card = getCard(sentinel.cardId);
    expect(() => SpecialCaseEngine.onHold(game, card, sentinel)).not.toThrow();
  });
});
