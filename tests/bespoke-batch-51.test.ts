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

describe("Arcane Shift (sfd-200)", () => {
  it("banishes and immediately redeploys the weakest friendly unit, then deals 3 to the weakest enemy unit at a battlefield", () => {
    const game = makeGame();
    const weakFriendly = putOnBase(game, "unit-doomed-recruit", "0");
    const strongFriendly = putOnBase(game, "unit-blazing-scorcher", "0");
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const shift = putOnBase(game, "sfd-200", "0");
    const card = getCard(shift.cardId);

    SpecialCaseEngine.onPlay(game, card, shift);

    expect(game.instances[weakFriendly.instanceId]).toBeUndefined();
    const redeployed = Object.values(game.instances).find(
      (i) => i.controller === "0" && i.cardId === "unit-doomed-recruit" && i.instanceId !== weakFriendly.instanceId,
    );
    expect(redeployed).toBeDefined();
    expect(game.players["0"].banishment).not.toContain("unit-doomed-recruit");
    expect(game.instances[strongFriendly.instanceId]).toBeDefined();
    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });

  it("banishes itself instead of trashing", () => {
    const game = makeGame();
    const shift = putOnBase(game, "sfd-200", "0");
    const card = getCard(shift.cardId);
    expect(SpecialCaseEngine.banishSelfOnResolve(game, card, shift)).toBe(true);
  });
});
