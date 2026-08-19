import { describe, it, expect, vi } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { playFromTrash } from "../src/game/moves";
import { getCard } from "../src/cards/db";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  return { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof playFromTrash>[0];
}

function fundRunePool(game: GameState, playerId: "0" | "1", runes: { domain: string; count: number }[]) {
  const pool: GameState["players"][typeof playerId]["runePool"] = [];
  let seq = 0;
  for (const { domain, count } of runes) {
    for (let i = 0; i < count; i += 1) {
      pool.push({ instanceId: `r${playerId}-${seq}`, domain: domain as never, exhausted: false });
      seq += 1;
    }
  }
  game.players[playerId].runePool = pool;
}

/**
 * [Flow]: play a spell from trash for its printed Flow cost, then banish it (game/moves.ts
 * playFromTrash, cards/db.ts parseFlowCost, cards/types.ts Card.flowCost).
 */
describe("[Flow]", () => {
  it("parses all 5 observed cost shapes correctly", () => {
    expect(getCard("ven-116").flowCost).toEqual({ energy: 3, runeDomainCount: 0, anyDomainRuneCount: 0 }); // Dragon Form: 3 Energy
    expect(getCard("ven-3").flowCost).toEqual({ energy: 4, runeDomain: "Fury", runeDomainCount: 1, anyDomainRuneCount: 0 }); // Brittle Steel
    expect(getCard("ven-127").flowCost).toEqual({ energy: 4, runeDomain: "Order", runeDomainCount: 2, anyDomainRuneCount: 0 }); // Lacerate
    expect(getCard("ven-140").flowCost).toEqual({ energy: 3, runeDomainCount: 0, anyDomainRuneCount: 1 }); // Shuriken Flip
    expect(getCard("ven-144").flowCost).toEqual({ energy: 1, runeDomainCount: 0, anyDomainRuneCount: 2 }); // Death Mark
    // Kennen/Stargazer mention "flow" only to describe what they GRANT to others — no own cost.
    expect(getCard("ven-113").flowCost).toBeUndefined();
    expect(getCard("ven-98").flowCost).toBeUndefined();
  });

  it("Dragon Form (ven-116, energy-only): plays from trash, banishes instead of re-trashing", () => {
    const game = makeGame();
    game.players["0"].trash = ["ven-116"];
    fundRunePool(game, "0", [{ domain: "Mind", count: 3 }]);
    const weak = putOnBase(game, "unit-plain-footman", "0"); // 2 Might

    const result = playFromTrash(ctx(game, "0"), {
      trashIndex: 0,
      energyRuneIds: ["r0-0", "r0-1", "r0-2"],
      runeDomainRuneIds: [],
      anyDomainRuneIds: [],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].trash).toEqual([]);
    expect(game.players["0"].banishment).toEqual(["ven-116"]);
    expect(weak.tempMightBonus).toBe(3); // brought from 2 to 5
  });

  it("Lacerate (ven-127, same domain twice + target): kills a low-Might target", () => {
    const game = makeGame();
    game.players["0"].trash = ["ven-127"];
    fundRunePool(game, "0", [
      { domain: "Mind", count: 4 },
      { domain: "Order", count: 2 },
    ]);
    const target = putOnBase(game, "unit-plain-footman", "1"); // 2 Might <= 3 threshold

    const result = playFromTrash(ctx(game, "0"), {
      trashIndex: 0,
      targetInstanceId: target.instanceId,
      energyRuneIds: ["r0-0", "r0-1", "r0-2", "r0-3"],
      runeDomainRuneIds: ["r0-4", "r0-5"],
      anyDomainRuneIds: [],
    });

    expect(result).toBeUndefined();
    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["0"].banishment).toEqual(["ven-127"]);
  });

  it("Shuriken Flip (ven-140, any-domain rune): accepts a rune of ANY domain for the domain-less slot", () => {
    const game = makeGame();
    game.players["0"].trash = ["ven-140"];
    fundRunePool(game, "0", [{ domain: "Chaos", count: 4 }]); // 3 energy + 1 any-domain, any domain works
    const enemy = putOnBase(game, "unit-plain-footman", "1");
    game.battlefields[0].units["1"].push(enemy.instanceId);
    enemy.zone = "battlefield";
    enemy.battlefieldIndex = 0;

    const result = playFromTrash(ctx(game, "0"), {
      trashIndex: 0,
      energyRuneIds: ["r0-0", "r0-1", "r0-2"],
      runeDomainRuneIds: [],
      anyDomainRuneIds: ["r0-3"],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].banishment).toEqual(["ven-140"]);
  });

  it("rejects a card with no flowCost", () => {
    const game = makeGame();
    game.players["0"].trash = ["unit-plain-footman"];

    const result = playFromTrash(ctx(game, "0"), {
      trashIndex: 0,
      energyRuneIds: [],
      runeDomainRuneIds: [],
      anyDomainRuneIds: [],
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects insufficient runes", () => {
    const game = makeGame();
    game.players["0"].trash = ["ven-116"];
    fundRunePool(game, "0", [{ domain: "Mind", count: 2 }]); // needs 3

    const result = playFromTrash(ctx(game, "0"), {
      trashIndex: 0,
      energyRuneIds: ["r0-0", "r0-1"],
      runeDomainRuneIds: [],
      anyDomainRuneIds: [],
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects a domain mismatch on a named-domain slot", () => {
    const game = makeGame();
    game.players["0"].trash = ["ven-3"]; // Brittle Steel, needs 1 Fury rune
    fundRunePool(game, "0", [{ domain: "Mind", count: 5 }]); // no Fury rune available
    putOnBase(game, "unit-plain-footman", "0"); // some friendly gear-less unit; Brittle Steel needs a friendly gear target though

    const result = playFromTrash(ctx(game, "0"), {
      trashIndex: 0,
      energyRuneIds: ["r0-0", "r0-1", "r0-2", "r0-3"],
      runeDomainRuneIds: ["r0-4"], // wrong domain
      anyDomainRuneIds: [],
    });

    expect(result).toBe(INVALID_MOVE);
  });
});

describe("Stargazer (ven-98): [Flow] costs 2 Energy less, to a minimum of 1 Energy", () => {
  it("reduces Dragon Form's 3-Energy Flow cost to 1", () => {
    const game = makeGame();
    putOnBase(game, "ven-98", "0");
    game.players["0"].trash = ["ven-116"];
    fundRunePool(game, "0", [{ domain: "Mind", count: 1 }]); // only 1, would fail without the reduction
    putOnBase(game, "unit-plain-footman", "0");

    const result = playFromTrash(ctx(game, "0"), {
      trashIndex: 0,
      energyRuneIds: ["r0-0"],
      runeDomainRuneIds: [],
      anyDomainRuneIds: [],
    });

    expect(result).toBeUndefined();
  });

  it("never reduces below 1 Energy — Death Mark's 1-Energy cost is unaffected", () => {
    const game = makeGame();
    putOnBase(game, "ven-98", "0");
    game.players["0"].trash = ["ven-144"];
    fundRunePool(game, "0", [{ domain: "Mind", count: 3 }]); // 1 energy + 2 any-domain

    const result = playFromTrash(ctx(game, "0"), {
      trashIndex: 0,
      energyRuneIds: [], // if the 1-Energy cost were reduced to 0, this would succeed
      runeDomainRuneIds: [],
      anyDomainRuneIds: ["r0-0", "r0-1"],
    });

    expect(result).toBe(INVALID_MOVE);
  });
});
