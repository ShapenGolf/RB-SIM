import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { activateAbility } from "../src/game/moves";
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

describe("Prize of Progress (sfd-75)", () => {
  it("gains +1 Might this turn when its controller activates a gear ability", () => {
    const game = makeGame();
    const prize = putOnBase(game, "sfd-75", "0");
    const gear = putOnBase(game, "gear-tactical-banner", "0");

    SpecialCaseEngine.onAllyActivatedGearAbility(game, getCard, "0", gear.instanceId);

    expect(prize.tempMightBonus).toBe(1);
  });

  it("doesn't trigger for an enemy's gear activation", () => {
    const game = makeGame();
    const prize = putOnBase(game, "sfd-75", "0");
    const enemyGear = putOnBase(game, "gear-tactical-banner", "1");

    SpecialCaseEngine.onAllyActivatedGearAbility(game, getCard, "1", enemyGear.instanceId);

    expect(prize.tempMightBonus).toBe(0);
  });

  it("fires through the real activateAbility move when a gear's own ability is used", () => {
    const game = makeGame();
    const prize = putOnBase(game, "sfd-75", "0", { exhausted: true }); // exhausted so Signpost's auto-pick skips it
    const signpost = putOnBase(game, "unl-45", "0"); // gear with a real activatedAbilityCost
    const costUnit = putOnBattlefield(game, "unit-doomed-recruit", "0", 1);
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);

    const result = activateAbility(ctx(game, "0"), {
      instanceId: signpost.instanceId,
      energyRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(costUnit.exhausted).toBe(true);
    expect(prize.tempMightBonus).toBe(1);
  });
});

describe("Valley of Idols (unl-218)", () => {
  it("buffs a unit played directly to it", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-218";
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    SpecialCaseEngine.onCardPlayedHere(game, getCard, 0, getCard(unit.cardId), unit, "0");

    expect(unit.statuses.buffed).toBe(true);
  });

  it("doesn't double-buff an already-buffed unit", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-218";
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    unit.statuses.buffed = true;

    expect(() => SpecialCaseEngine.onCardPlayedHere(game, getCard, 0, getCard(unit.cardId), unit, "0")).not.toThrow();
    expect(unit.statuses.buffed).toBe(true);
  });

  it("doesn't buff a gear played there", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-218";
    const gear = putOnBattlefield(game, "gear-tactical-banner", "0", 0);

    SpecialCaseEngine.onCardPlayedHere(game, getCard, 0, getCard(gear.cardId), gear, "0");

    expect(gear.statuses.buffed).toBeUndefined();
  });

  it("triggers for either player's unit", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "unl-218";
    const enemyUnit = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);

    SpecialCaseEngine.onCardPlayedHere(game, getCard, 0, getCard(enemyUnit.cardId), enemyUnit, "1");

    expect(enemyUnit.statuses.buffed).toBe(true);
  });
});
