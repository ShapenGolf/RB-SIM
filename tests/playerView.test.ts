import { describe, it, expect } from "vitest";
import { playerView } from "../src/game/playerView";
import { makeGame } from "./helpers";

describe("playerView (server-side redaction for the Socket.IO transport)", () => {
  it("redacts the OTHER player's hand, mainDeck, runeDeck, hiddenZone card identities, and battlefieldPool, preserving lengths", () => {
    const game = makeGame();
    game.players["1"].hand = ["unit-plain-footman", "unit-plain-guard"];
    game.players["1"].mainDeck = ["ogn-9", "ogn-57", "unl-23"];
    game.players["1"].runeDeck = [
      { instanceId: "r1", domain: "Fury", exhausted: false },
      { instanceId: "r2", domain: "Calm", exhausted: false },
    ];
    game.players["1"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 3 }];
    game.players["1"].battlefieldPool = ["battlefield-ancient-ruins", "unl-battlefield-a", "unl-battlefield-b"];

    const view = playerView({ G: game, playerID: "0" });

    expect(view.players["1"].hand).toEqual(["hidden", "hidden"]);
    expect(view.players["1"].mainDeck).toEqual(["hidden", "hidden", "hidden"]);
    expect(view.players["1"].runeDeck.map((r) => r.instanceId)).not.toContain("r1");
    expect(view.players["1"].runeDeck).toHaveLength(2);
    expect(view.players["1"].hiddenZone).toEqual([{ cardId: "hidden", battlefieldIndex: 0, hiddenOnGameTurn: 3 }]);
    expect(view.players["1"].battlefieldPool).toEqual(["hidden", "hidden", "hidden"]);
  });

  it("does NOT redact the requesting player's own zones", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].mainDeck = ["ogn-9"];

    const view = playerView({ G: game, playerID: "0" });

    expect(view.players["0"].hand).toEqual(["unit-plain-footman"]);
    expect(view.players["0"].mainDeck).toEqual(["ogn-9"]);
  });

  it("redacts BOTH players when playerID is null/undefined (spectator view)", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["1"].hand = ["unit-plain-guard"];

    const view = playerView({ G: game, playerID: null });

    expect(view.players["0"].hand).toEqual(["hidden"]);
    expect(view.players["1"].hand).toEqual(["hidden"]);
  });

  it("does NOT redact public zones: trash, banishment, base, runePool, points, legend", () => {
    const game = makeGame();
    game.players["1"].trash = ["unit-plain-footman"];
    game.players["1"].banishment = ["unit-plain-guard"];
    game.players["1"].points = 3;

    const view = playerView({ G: game, playerID: "0" });

    expect(view.players["1"].trash).toEqual(["unit-plain-footman"]);
    expect(view.players["1"].banishment).toEqual(["unit-plain-guard"]);
    expect(view.players["1"].points).toBe(3);
  });

  it("leaves shared/board-level state (instances, battlefields) untouched", () => {
    const game = makeGame();
    const view = playerView({ G: game, playerID: "0" });

    expect(view.instances).toBe(game.instances);
    expect(view.battlefields).toBe(game.battlefields);
  });
});
