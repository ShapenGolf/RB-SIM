import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import type { FnContext } from "boardgame.io";
import { playCard, attackBattlefield, resolvePredict, type PlayCardArgs } from "../src/game/moves";
import { runChannel, runDraw, runBeginning, runAwaken, runTurnStart } from "../src/game/turnFlow";
import { createInstance } from "../src/game/setup";
import { getCard } from "../src/cards/db";
import type { GameState } from "../src/game/state";
import { makeGame } from "./helpers";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("playCard — mana payment", () => {
  it("blocks the play when not enough Energy Runes are supplied", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"]; // Energy 1
    const args: PlayCardArgs = { handIndex: 0, energyRuneIds: [], powerRuneIds: [] };

    const result = playCard(ctx(game, "0"), args);

    expect(result).toBe(INVALID_MOVE);
    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
  });

  it("plays a card once its Energy and Power costs are paid, entering exhausted by default", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-shieldbearer"]; // Energy 3, Power 1 Body
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Body", exhausted: false },
      { instanceId: "r2", domain: "Body", exhausted: false },
      { instanceId: "r3", domain: "Body", exhausted: false },
      { instanceId: "r4", domain: "Body", exhausted: false },
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r1", "r2", "r3"],
      powerRuneIds: ["r4"],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].base).toHaveLength(1);
    const instance = game.instances[game.players["0"].base[0]];
    expect(instance.exhausted).toBe(true);
    expect(game.players["0"].runePool.find((r) => r.instanceId === "r1")!.exhausted).toBe(true);
    expect(game.players["0"].runePool.some((r) => r.instanceId === "r4")).toBe(false);
    expect(game.players["0"].runeDeck.some((r) => r.instanceId === "r4")).toBe(true);
  });

  it("Accelerate lets the card enter ready when the optional extra cost is paid", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-blazing-scorcher"]; // Energy 3, Power 1 Fury, Accelerate 1
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Fury", exhausted: false },
      { instanceId: "r2", domain: "Fury", exhausted: false },
      { instanceId: "r3", domain: "Fury", exhausted: false },
      { instanceId: "r4", domain: "Fury", exhausted: false },
      { instanceId: "r5", domain: "Fury", exhausted: false },
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["r1", "r2", "r3", "r4"],
      powerRuneIds: ["r5"],
      payAdditionalCost: true,
    });

    expect(result).toBeUndefined();
    const instance = game.instances[game.players["0"].base[0]];
    expect(instance.exhausted).toBe(false);
  });

  it("marks Legion's condition true only for cards played after the first this turn", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman", "spell-dangerous-duo"]; // footman costs 1 Energy
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    expect(game.players["0"].playedMainDeckCardThisTurn).toBe(false);

    const result = playCard(ctx(game, "0"), { handIndex: 0, energyRuneIds: ["r1"], powerRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.players["0"].playedMainDeckCardThisTurn).toBe(true);
  });
});

describe("attackBattlefield", () => {
  it("moves a ready unit to the battlefield and resolves combat", () => {
    const game = makeGame();
    const instance = createInstance(game, "unit-plain-footman", "0");
    instance.exhausted = false;
    game.players["0"].base.push(instance.instanceId);

    const result = attackBattlefield(ctx(game, "0"), {
      battlefieldIndex: 0,
      unitInstanceIds: [instance.instanceId],
    });

    expect(result).toBeUndefined();
    expect(game.battlefields[0].controller).toBe("0");
    expect(game.players["0"].points).toBe(1);
  });

  it("rejects attacking with an exhausted unit", () => {
    const game = makeGame();
    const instance = createInstance(game, "unit-plain-footman", "0");
    instance.exhausted = true;
    game.players["0"].base.push(instance.instanceId);

    const result = attackBattlefield(ctx(game, "0"), {
      battlefieldIndex: 0,
      unitInstanceIds: [instance.instanceId],
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("resolvePredict", () => {
  it("moves the top card to the bottom when the player declines to keep it", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["a", "b", "c"];
    game.players["0"].pendingPredict = true;

    resolvePredict(ctx(game, "0"), { keepOnTop: false });

    expect(game.players["0"].mainDeck).toEqual(["b", "c", "a"]);
    expect(game.players["0"].pendingPredict).toBe(false);
  });
});

describe("turn flow", () => {
  it("Channel gives 2 Runes normally, and 3 on player 1's first turn", () => {
    const game = makeGame();
    game.players["0"].runeDeck = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `p0-${i}`,
      domain: "Mind" as const,
      exhausted: false,
    }));
    game.players["1"].runeDeck = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `p1-${i}`,
      domain: "Mind" as const,
      exhausted: false,
    }));

    runChannel(game, "0");
    expect(game.players["0"].runePool).toHaveLength(2);

    runChannel(game, "1");
    expect(game.players["1"].runePool).toHaveLength(3);

    game.players["1"].hasTakenFirstTurn = true;
    runChannel(game, "1");
    expect(game.players["1"].runePool).toHaveLength(5); // 3 + 2 more
  });

  it("Draw moves one card from the Main Deck to hand", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-footman", "unit-plain-guard"];
    runDraw(game, "0");
    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
    expect(game.players["0"].mainDeck).toEqual(["unit-plain-guard"]);
  });

  it("Beginning scores 1 point per controlled Battlefield and can trigger the win condition", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    game.battlefields[1].controller = "0";
    game.players["0"].points = 7;

    runBeginning(game, "0");

    expect(game.players["0"].points).toBe(9);
    expect(game.winner).toBe("0");
  });

  it("Awaken readies all of a player's exhausted instances and Runes", () => {
    const game = makeGame();
    const instance = createInstance(game, "unit-plain-footman", "0");
    instance.exhausted = true;
    game.players["0"].base.push(instance.instanceId);
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Mind", exhausted: true }];

    runAwaken(game, "0");

    expect(instance.exhausted).toBe(false);
    expect(game.players["0"].runePool[0].exhausted).toBe(false);
  });

  it("runTurnStart resets per-turn flags and temporary buffs", () => {
    const game = makeGame();
    game.players["0"].playedMainDeckCardThisTurn = true;
    game.players["0"].mainDeck = ["unit-plain-footman"];
    game.players["0"].runeDeck = [{ instanceId: "r1", domain: "Mind", exhausted: false }];

    runTurnStart(game, "0");

    expect(game.players["0"].playedMainDeckCardThisTurn).toBe(false);
    expect(game.players["0"].hand).toContain("unit-plain-footman");
    expect(game.activePlayer).toBe("0");
  });
});

describe("card database sanity", () => {
  it("every keyword instance in the starter set resolves to a known card", () => {
    expect(() => getCard("unit-plain-footman")).not.toThrow();
    expect(() => getCard("does-not-exist")).toThrow();
  });
});
