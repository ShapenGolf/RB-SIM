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

describe("Mageseeker Warden (ogn-70)", () => {
  it("blocks opponents from playing units directly to its battlefield", () => {
    const game = makeGame();
    putOnBattlefield(game, "ogn-70", "0", 0);

    expect(SpecialCaseEngine.blocksUnitsPlayedHere(game, getCard, 0, "1")).toBe(true);
  });

  it("doesn't block its own controller", () => {
    const game = makeGame();
    putOnBattlefield(game, "ogn-70", "0", 0);

    expect(SpecialCaseEngine.blocksUnitsPlayedHere(game, getCard, 0, "0")).toBe(false);
  });

  it("doesn't block plays at a different battlefield", () => {
    const game = makeGame();
    putOnBattlefield(game, "ogn-70", "0", 0);

    expect(SpecialCaseEngine.blocksUnitsPlayedHere(game, getCard, 1, "1")).toBe(false);
  });
});

describe("Moot no-op registrations (batch 94)", () => {
  const cases: [string, string][] = [
    ["ogn-158", "volibear-imposing"],
    ["sfd-144", "spirit-wheel"],
    ["ogn-292", "the-dreaming-tree"],
    ["unl-213", "gardens-of-becoming"],
  ];

  for (const [cardId, specialCaseId] of cases) {
    it(`${cardId} resolves to the ${specialCaseId} handler`, () => {
      expect(getCard(cardId).specialCaseId).toBe(specialCaseId);
    });
  }
});
