import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { applyStun } from "../src/cards/special-cases/stun";
import { resolveHoldTriggers } from "../src/game/combat";
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

describe("Gloomist (unl-193)", () => {
  it("exhausts to draw 1 when the controller holds a battlefield", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-193", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    game.battlefields[0].controller = "0";
    putOnBattlefield(game, "token-tentacle", "0", 0);

    resolveHoldTriggers(game, getCard, "0");
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
    expect(game.players["0"].legend?.exhausted).toBe(true);
  });

  it("doesn't double-draw when holding two battlefields (only exhausts once)", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-193", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit", "token-shadow-clone"];
    game.battlefields[0].controller = "0";
    game.battlefields[1].controller = "0";
    putOnBattlefield(game, "token-tentacle", "0", 0);
    putOnBattlefield(game, "unit-blazing-scorcher", "0", 1);

    resolveHoldTriggers(game, getCard, "0");
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
  });
});

describe("Radiant Dawn (ogn-261)", () => {
  it("buffs the strongest unbuffed friendly unit when the controller stuns an enemy", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-261", exhausted: false };
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");

    applyStun(game, getCard, enemy, "0");
    expect(strong.statuses.buffed).toBe(true);
    expect(weak.statuses.buffed).toBeFalsy();
  });
});

describe("Keeper of the Hammer (unl-237)", () => {
  it("gains 1 XP per battlefield held", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-237", exhausted: false };
    game.battlefields[0].controller = "0";
    game.battlefields[1].controller = "0";
    putOnBattlefield(game, "token-tentacle", "0", 0);
    putOnBattlefield(game, "unit-blazing-scorcher", "0", 1);

    resolveHoldTriggers(game, getCard, "0");
    expect(game.players["0"].xp).toBe(2);
  });
});

describe("Chem-Baroness (sfd-249)", () => {
  it("exhausts to play an exhausted Gold gear token when holding", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-249", exhausted: false };
    game.battlefields[0].controller = "0";
    putOnBattlefield(game, "token-tentacle", "0", 0);

    resolveHoldTriggers(game, getCard, "0");
    expect(game.players["0"].legend?.exhausted).toBe(true);
    const token = Object.values(game.instances).find((i) => i.cardId === "token-gold-gear");
    expect(token).toBeDefined();
    expect(token?.exhausted).toBe(true);
  });
});
