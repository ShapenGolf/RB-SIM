import { describe, it, expect, vi } from "vitest";
import { attackBattlefield } from "../src/game/moves";
import { moveInstanceToBattlefield } from "../src/cards/special-cases/move-helpers";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  return { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof attackBattlefield>[0];
}

/**
 * Volibear, Imposing (ogn-158): "When an opponent moves to a battlefield other than mine, draw
 * 1." Exercises the new onAnyoneArrivedAtBattlefield broadcast, fired from both the attack/
 * Ganking move path (attackBattlefield) and forced relocations (moveInstanceToBattlefield).
 */
describe("Volibear, Imposing (ogn-158)", () => {
  it("draws when an opponent moves to a DIFFERENT battlefield than Volibear's own", () => {
    const game = makeGame();
    const volibear = putOnBase(game, "ogn-158", "0");
    game.battlefields[0].units["0"].push(volibear.instanceId);
    volibear.zone = "battlefield";
    volibear.battlefieldIndex = 0;
    game.players["0"].mainDeck = ["unit-plain-footman"];

    const enemy = putOnBase(game, "unit-plain-footman", "1");
    enemy.exhausted = false;

    attackBattlefield(ctx(game, "1"), { battlefieldIndex: 1, unitInstanceIds: [enemy.instanceId] });

    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
  });

  it("does NOT draw when the opponent moves to Volibear's OWN battlefield", () => {
    const game = makeGame();
    const volibear = putOnBase(game, "ogn-158", "0");
    game.battlefields[0].units["0"].push(volibear.instanceId);
    volibear.zone = "battlefield";
    volibear.battlefieldIndex = 0;
    game.players["0"].mainDeck = ["unit-plain-footman"];

    const enemy = putOnBase(game, "unit-plain-footman", "1");
    enemy.exhausted = false;

    attackBattlefield(ctx(game, "1"), { battlefieldIndex: 0, unitInstanceIds: [enemy.instanceId] });

    expect(game.players["0"].hand).toEqual([]);
  });

  it("does NOT draw when a FRIENDLY unit moves (not an opponent)", () => {
    const game = makeGame();
    const volibear = putOnBase(game, "ogn-158", "0");
    game.battlefields[0].units["0"].push(volibear.instanceId);
    volibear.zone = "battlefield";
    volibear.battlefieldIndex = 0;
    game.players["0"].mainDeck = ["unit-plain-footman"];

    const ally = putOnBase(game, "unit-plain-footman", "0");
    ally.exhausted = false;

    attackBattlefield(ctx(game, "0"), { battlefieldIndex: 1, unitInstanceIds: [ally.instanceId] });

    expect(game.players["0"].hand).toEqual([]);
  });

  it("does NOT draw while Volibear is at base (no 'mine' battlefield to compare)", () => {
    const game = makeGame();
    putOnBase(game, "ogn-158", "0"); // stays at base
    game.players["0"].mainDeck = ["unit-plain-footman"];

    const enemy = putOnBase(game, "unit-plain-footman", "1");
    enemy.exhausted = false;

    attackBattlefield(ctx(game, "1"), { battlefieldIndex: 0, unitInstanceIds: [enemy.instanceId] });

    expect(game.players["0"].hand).toEqual([]);
  });

  it("also fires from a forced relocation (moveInstanceToBattlefield), not just attacks", () => {
    const game = makeGame();
    const volibear = putOnBase(game, "ogn-158", "0");
    game.battlefields[0].units["0"].push(volibear.instanceId);
    volibear.zone = "battlefield";
    volibear.battlefieldIndex = 0;
    game.players["0"].mainDeck = ["unit-plain-footman"];

    const enemy = putOnBase(game, "unit-plain-footman", "1");

    moveInstanceToBattlefield(game, enemy.instanceId, 1);

    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
  });
});
