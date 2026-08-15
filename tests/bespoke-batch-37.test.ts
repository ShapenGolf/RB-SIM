import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { computeMight } from "../src/game/might";
import { runBeginning } from "../src/game/turnFlow";
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

describe("Loose Cannon (ogn-301)", () => {
  it("draws 1 at the Beginning Phase when hand has 1 or fewer cards", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-301", exhausted: false };
    game.players["0"].hand = ["token-tentacle"];
    game.players["0"].mainDeck = ["unit-doomed-recruit"];

    runBeginning(game, "0");
    expect(game.players["0"].hand).toEqual(["token-tentacle", "unit-doomed-recruit"]);
  });

  it("doesn't draw with 2+ cards in hand", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-301", exhausted: false };
    game.players["0"].hand = ["token-tentacle", "token-shadow-clone"];
    game.players["0"].mainDeck = ["unit-doomed-recruit"];

    runBeginning(game, "0");
    expect(game.players["0"].hand).toEqual(["token-tentacle", "token-shadow-clone"]);
  });
});

describe("Mechanized Menace (sfd-181)", () => {
  it("gives friendly Mechs +1 Might while defending, not while attacking", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-181", exhausted: false };
    const mech = putOnBattlefield(game, "ogn-56", "0", 0); // Adaptatron, tagged Mech

    expect(computeMight(game, getCard, mech, "defending")).toBe(
      (getCard(mech.cardId).might ?? 0) + 1,
    );
    expect(computeMight(game, getCard, mech, "attacking")).toBe(getCard(mech.cardId).might ?? 0);
  });

  it("doesn't affect non-Mech units", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-181", exhausted: false };
    const nonMech = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    expect(computeMight(game, getCard, nonMech, "defending")).toBe(getCard(nonMech.cardId).might ?? 0);
  });
});

describe("Wuju Bladesman - Starter (ogs-19)", () => {
  it("gives a lone defending friendly unit +2 Might", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-19", exhausted: false };
    const solo = putOnBattlefield(game, "unit-doomed-recruit", "0", 1);

    expect(computeMight(game, getCard, solo, "defending")).toBe((getCard(solo.cardId).might ?? 0) + 2);
  });

  it("doesn't apply the bonus when defending alongside another friendly unit", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-19", exhausted: false };
    const first = putOnBattlefield(game, "unit-doomed-recruit", "0", 1);
    putOnBattlefield(game, "token-tentacle", "0", 1);

    expect(computeMight(game, getCard, first, "defending")).toBe(getCard(first.cardId).might ?? 0);
  });
});
