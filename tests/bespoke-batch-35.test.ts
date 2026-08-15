import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { endTurn } from "../src/game/moves";
import { resolveCombat } from "../src/game/combat";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function endTurnFor(G: GameState, playerID: "0" | "1") {
  endTurn({ G, playerID, events: { endTurn: () => {} } } as unknown as Parameters<typeof endTurn>[0], undefined as never);
}

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Dark Child - Starter (ogs-17)", () => {
  it("readies 2 exhausted runes at the end of the controller's turn", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-17", exhausted: false };
    game.players["0"].runePool.push(
      { instanceId: "r0", domain: "Mind", exhausted: true },
      { instanceId: "r1", domain: "Mind", exhausted: true },
      { instanceId: "r2", domain: "Mind", exhausted: true },
    );

    endTurnFor(game, "0");
    const readyCount = game.players["0"].runePool.filter((r) => !r.exhausted).length;
    expect(readyCount).toBe(2);
  });

  it("doesn't affect the other player's runes", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-17", exhausted: false };
    game.players["1"].runePool.push({ instanceId: "r0", domain: "Mind", exhausted: true });

    endTurnFor(game, "0");
    expect(game.players["1"].runePool[0].exhausted).toBe(true);
  });
});

describe("Glorious Executioner (sfd-185)", () => {
  it("draws 1 when the controller's Legend is in play and their side wins a real Showdown", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-185", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    putOnBattlefield(game, "unit-blazing-scorcher", "0", 0); // Might 3, survives
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1, dies

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
  });

  it("doesn't draw for the losing side", () => {
    const game = makeGame();
    game.players["1"].legend = { cardId: "sfd-185", exhausted: false };
    game.players["1"].mainDeck = ["token-tentacle"];
    putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    putOnBattlefield(game, "token-tentacle", "1", 0); // Might 1, no Deathknell to confound the draw count

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["1"].hand).toEqual([]);
  });

  it("doesn't fire on an unopposed conquest (no real Showdown)", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-185", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].hand).toEqual([]);
  });
});
