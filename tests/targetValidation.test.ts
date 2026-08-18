import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { playCard, activateAbility } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof playCard>[0];
}

/** Vengeance (ogn-229): "Kill a unit." — a spell whose entire effect IS the targeted action. */
function setUpVengeance(game: GameState) {
  game.players["0"].hand = ["ogn-229"];
  game.players["0"].runePool = [
    { instanceId: "e1", domain: "Mind", exhausted: false },
    { instanceId: "e2", domain: "Mind", exhausted: false },
    { instanceId: "e3", domain: "Mind", exhausted: false },
    { instanceId: "e4", domain: "Mind", exhausted: false },
    { instanceId: "p1", domain: "Order", exhausted: false },
    { instanceId: "p2", domain: "Order", exhausted: false },
  ];
}

describe("target validation — mandatory SPELL target (Vengeance, ogn-229)", () => {
  it("rejects casting with zero legal targets on board — can't pay for a no-op", () => {
    const game = makeGame();
    setUpVengeance(game);

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e1", "e2", "e3", "e4"],
      powerRuneIds: ["p1", "p2"],
    });

    expect(result).toBe("INVALID_MOVE");
    expect(game.players["0"].hand).toContain("ogn-229"); // card never left hand, cost never paid
  });

  it("rejects casting without choosing a target when legal ones exist", () => {
    const game = makeGame();
    setUpVengeance(game);
    putOnBase(game, "unit-plain-footman", "1");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e1", "e2", "e3", "e4"],
      powerRuneIds: ["p1", "p2"],
    });

    expect(result).toBe("INVALID_MOVE");
  });

  it("rejects casting at an illegal explicit target", () => {
    const game = makeGame();
    setUpVengeance(game);
    const foe = putOnBase(game, "unit-plain-footman", "1");
    void foe;

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e1", "e2", "e3", "e4"],
      powerRuneIds: ["p1", "p2"],
      targetInstanceId: "not-a-real-instance",
    });

    expect(result).toBe("INVALID_MOVE");
  });

  it("succeeds with a legal explicit target", () => {
    const game = makeGame();
    setUpVengeance(game);
    const foe = putOnBase(game, "unit-plain-footman", "1");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e1", "e2", "e3", "e4"],
      powerRuneIds: ["p1", "p2"],
      targetInstanceId: foe.instanceId,
    });

    expect(result).toBeUndefined();
    expect(game.instances[foe.instanceId]).toBeUndefined();
  });
});

describe("target validation — mandatory UNIT onPlay trigger (Harnessed Dragon, ogn-234)", () => {
  it("still deploys with zero legal targets — the ETB trigger just fizzles, unlike a spell", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-234"];
    game.players["0"].runePool = [
      ...Array.from({ length: 8 }, (_, i) => ({ instanceId: `e${i}`, domain: "Mind" as const, exhausted: false })),
      { instanceId: "p1", domain: "Order" as const, exhausted: false },
      { instanceId: "p2", domain: "Order" as const, exhausted: false },
    ];

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: Array.from({ length: 8 }, (_, i) => `e${i}`),
      powerRuneIds: ["p1", "p2"],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].base.length).toBe(1); // the dragon itself entered play
  });
});

describe("target validation — optional UNIT onPlay trigger (Grim Apothecary, unl-21)", () => {
  it("still deploys with zero legal targets — \"you may\" allows skipping", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-21"];
    game.players["0"].runePool = Array.from({ length: 3 }, (_, i) => ({
      instanceId: `e${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0", "e1", "e2"],
      powerRuneIds: [],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].base.length).toBe(1);
  });

  it("allows skipping the choice even when a legal candidate exists", () => {
    const game = makeGame();
    game.players["0"].hand = ["unl-21"];
    game.players["0"].runePool = Array.from({ length: 3 }, (_, i) => ({
      instanceId: `e${i}`,
      domain: "Fury" as const,
      exhausted: false,
    }));
    const friendly = putOnBase(game, "unit-plain-footman", "0");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0", "e1", "e2"],
      powerRuneIds: [],
    });

    expect(result).toBeUndefined();
    expect(game.instances[friendly.instanceId]).toBeDefined(); // not recalled — the player skipped
  });
});

describe("target validation — activated ability (Heart of Dark Ice, sfd-52)", () => {
  it("rejects activating with zero legal targets on board", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-52", "0", { exhausted: false });
    void getCard(gear.cardId);

    const result = activateAbility(ctx(game, "0"), { instanceId: gear.instanceId, energyRuneIds: [] });

    expect(result).toBe("INVALID_MOVE");
    expect(gear.exhausted).toBe(false); // cost never paid
  });
});
