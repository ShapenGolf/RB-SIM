import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import type { FnContext } from "boardgame.io";
import { chooseBattlefield } from "../src/game/moves";
import type { GameState } from "../src/game/state";
import { makeGame } from "./helpers";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("chooseBattlefield", () => {
  it("writes the pick into the matching battlefield slot (0 for player 0, 1 for player 1)", () => {
    const game = makeGame();
    game.players["0"].battlefieldPool = ["battlefield-ancient-ruins", "unl-205", "unl-206"];
    game.players["0"].chosenBattlefieldId = null;
    game.players["1"].battlefieldPool = ["ogn-275", "unl-205", "unl-206"];
    game.players["1"].chosenBattlefieldId = null;

    const result0 = chooseBattlefield(ctx(game, "0"), { cardId: "unl-205" });
    const result1 = chooseBattlefield(ctx(game, "1"), { cardId: "ogn-275" });

    expect(result0).toBeUndefined();
    expect(result1).toBeUndefined();
    expect(game.battlefields[0].cardId).toBe("unl-205");
    expect(game.battlefields[1].cardId).toBe("ogn-275");
    expect(game.players["0"].chosenBattlefieldId).toBe("unl-205");
    expect(game.players["1"].chosenBattlefieldId).toBe("ogn-275");
  });

  it("rejects a card outside the player's own pool", () => {
    const game = makeGame();
    game.players["0"].battlefieldPool = ["battlefield-ancient-ruins"];
    game.players["0"].chosenBattlefieldId = null;

    const result = chooseBattlefield(ctx(game, "0"), { cardId: "unl-205" });

    expect(result).toBe(INVALID_MOVE);
    expect(game.players["0"].chosenBattlefieldId).toBeNull();
  });

  it("rejects a second pick", () => {
    const game = makeGame();
    game.players["0"].battlefieldPool = ["battlefield-ancient-ruins", "unl-205"];
    game.players["0"].chosenBattlefieldId = null;
    chooseBattlefield(ctx(game, "0"), { cardId: "battlefield-ancient-ruins" });

    const result = chooseBattlefield(ctx(game, "0"), { cardId: "unl-205" });

    expect(result).toBe(INVALID_MOVE);
    expect(game.players["0"].chosenBattlefieldId).toBe("battlefield-ancient-ruins");
  });
});
