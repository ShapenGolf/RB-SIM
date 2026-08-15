import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { resolveCombat } from "../src/game/combat";
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

describe("Void Burrower (sfd-243)", () => {
  it("exhausts to reveal 2, play the pricier one, and recycle the rest to bottom of deck", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-243", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher", "token-tentacle"];
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].legend?.exhausted).toBe(true);
    const played = Object.values(game.instances).find(
      (i) => i.controller === "0" && i.cardId === "unit-blazing-scorcher",
    );
    expect(played).toBeDefined();
    expect(game.players["0"].mainDeck[0]).toBe("token-tentacle");
    expect(game.players["0"].mainDeck[game.players["0"].mainDeck.length - 1]).toBe("unit-doomed-recruit");
  });

  it("does nothing if the Legend is already exhausted", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-243", exhausted: true };
    game.players["0"].mainDeck = ["unit-doomed-recruit", "unit-blazing-scorcher"];
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].mainDeck.length).toBe(2);
  });
});

describe("Blade Dancer (sfd-246)", () => {
  it("readies the Legend when its controller conquers", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-246", exhausted: true };
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].legend?.exhausted).toBe(false);
  });
});
