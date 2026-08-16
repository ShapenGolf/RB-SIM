import { describe, it, expect } from "vitest";
import { moveInstanceToBase, moveInstanceToBattlefield } from "../src/cards/special-cases/move-helpers";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";
import { getCard } from "../src/cards/db";

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Back-Alley Bar (ogn-277)", () => {
  it("gives +1 Might to a unit that moves away from it (via moveInstanceToBase)", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "ogn-277";
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    moveInstanceToBase(game, getCard, unit.instanceId);

    expect(unit.tempMightBonus).toBe(1);
  });

  it("gives +1 Might to a unit that moves away from it (via moveInstanceToBattlefield)", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "ogn-277";
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    moveInstanceToBattlefield(game, unit.instanceId, 1);

    expect(unit.tempMightBonus).toBe(1);
  });

  it("doesn't affect moves from a different battlefield", () => {
    const game = makeGame();
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    moveInstanceToBase(game, getCard, unit.instanceId);

    expect(unit.tempMightBonus).toBe(0);
  });
});
