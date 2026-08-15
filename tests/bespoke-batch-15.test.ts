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

describe("Pakaa Protector (ven-33)", () => {
  it("draws the revealed card if it's a unit", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const protector = putOnBattlefield(game, "ven-33", "0", 0);
    const card = getCard(protector.cardId);

    SpecialCaseEngine.onMove(game, card, protector);

    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
    expect(protector.tempMightBonus).toBe(0);
  });

  it("trashes a non-unit and gives +2 Might this turn", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["gear-tactical-banner"];
    const protector = putOnBattlefield(game, "ven-33", "0", 0);
    const card = getCard(protector.cardId);

    SpecialCaseEngine.onMove(game, card, protector);

    expect(game.players["0"].trash).toEqual(["gear-tactical-banner"]);
    expect(game.players["0"].hand).toEqual([]);
    expect(protector.tempMightBonus).toBe(2);
  });
});

describe("Perfect Execution (ven-12)", () => {
  it("readies the target and grants Assault 3 this turn", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const spell = putOnBase(game, "ven-12", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(target.exhausted).toBe(false);
    expect(target.grantedThisTurn).toContainEqual({ keyword: "assault", value: 3 });
  });
});

describe("Rage Amplifier (ven-18)", () => {
  it("gives friendly units +1 Might, not itself", () => {
    const game = makeGame();
    putOnBase(game, "ven-18", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");

    expect(SpecialCaseEngine.staticMightModifierFromAllies(game, getCard, ally)).toBe(1);
  });

  it("gives +2 instead while Empowered", () => {
    const game = makeGame();
    const amp = putOnBase(game, "ven-18", "0");
    amp.statuses.empowered = true;
    const ally = putOnBase(game, "unit-plain-footman", "0");

    expect(SpecialCaseEngine.staticMightModifierFromAllies(game, getCard, ally)).toBe(2);
  });
});

describe("Sinister Poro (unl-137)", () => {
  it("offers 1 Energy on attack to move the weakest enemy here to base", () => {
    const game = makeGame();
    const poro = putOnBattlefield(game, "unl-137", "0", 0);
    const weak = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    const card = getCard(poro.cardId);

    SpecialCaseEngine.onAttack(game, card, poro);
    expect(game.pendingOptionalCost).toEqual({
      playerId: "0",
      specialCaseId: "sinister-poro",
      cost: { energy: 1 },
      payload: "0",
    });

    SpecialCaseEngine.onOptionalCostPaid(game, "sinister-poro", "0", "0");

    expect(weak.zone).toBe("base");
    expect(game.battlefields[0].units["1"]).not.toContain(weak.instanceId);
  });
});

describe("Steel Paws (ven-43)", () => {
  it("has no bonus while not Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-43", "0");

    expect(computeMight(game, getCard, unit, "none")).toBe(0);
  });

  it("has +7 Might once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-43", "0");
    unit.statuses.empowered = true;

    expect(computeMight(game, getCard, unit, "none")).toBe(7);
  });
});

describe("Tomb-Raider Barbara (ven-37)", () => {
  it("kills a non-Empowered enemy gear with 7+ runes", () => {
    const game = makeGame();
    const enemyGear = putOnBase(game, "gear-tactical-banner", "1");
    const barbara = putOnBase(game, "ven-37", "0");
    for (let i = 0; i < 7; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Calm", exhausted: false });
    }
    const card = getCard(barbara.cardId);

    SpecialCaseEngine.onPlay(game, card, barbara, enemyGear.instanceId);

    expect(game.instances[enemyGear.instanceId]).toBeUndefined();
  });

  it("disempowers instead of killing an Empowered enemy gear", () => {
    const game = makeGame();
    const enemyGear = putOnBase(game, "gear-tactical-banner", "1");
    enemyGear.statuses.empowered = true;
    const barbara = putOnBase(game, "ven-37", "0");
    for (let i = 0; i < 7; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Calm", exhausted: false });
    }
    const card = getCard(barbara.cardId);

    SpecialCaseEngine.onPlay(game, card, barbara, enemyGear.instanceId);

    expect(game.instances[enemyGear.instanceId]).toBeDefined();
    expect(enemyGear.statuses.empowered).toBe(false);
  });

  it("does nothing with fewer than 7 runes", () => {
    const game = makeGame();
    const enemyGear = putOnBase(game, "gear-tactical-banner", "1");
    const barbara = putOnBase(game, "ven-37", "0");
    const card = getCard(barbara.cardId);

    SpecialCaseEngine.onPlay(game, card, barbara, enemyGear.instanceId);

    expect(game.instances[enemyGear.instanceId]).toBeDefined();
  });
});

describe("Viktor, Innovator (ven-176)", () => {
  it("plays a Recruit token when a card is played on the opponent's turn", () => {
    const game = makeGame();
    putOnBase(game, "ven-176", "0");
    game.activePlayer = "1";
    const anyCard = getCard("unit-doomed-recruit");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", anyCard, 1);

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-recruit");
    expect(tokenId).toBeDefined();
  });

  it("doesn't trigger on the controller's own turn", () => {
    const game = makeGame();
    putOnBase(game, "ven-176", "0");
    game.activePlayer = "0";
    const anyCard = getCard("unit-doomed-recruit");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", anyCard, 1);

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-recruit");
    expect(tokenId).toBeUndefined();
  });
});

describe("Wind and Ghosts (ven-106)", () => {
  it("banishes a unit with 3 Might or less", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const spell = putOnBase(game, "ven-106", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["1"].banishment).toContain("unit-doomed-recruit");
  });

  it("returns a stronger unit to hand instead", () => {
    const game = makeGame();
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0); // Might 3
    target.tempMightBonus = 3; // Might 6
    const spell = putOnBase(game, "ven-106", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toContain("unit-blazing-scorcher");
    expect(game.players["1"].banishment).not.toContain("unit-blazing-scorcher");
  });
});
