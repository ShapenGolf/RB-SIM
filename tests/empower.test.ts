import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import type { FnContext } from "boardgame.io";
import { empowerInstance } from "../src/game/moves";
import { computeMight } from "../src/game/might";
import { getCard } from "../src/cards/db";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("empowerInstance", () => {
  it("pays a flat Energy cost and sets empowered/everEmpowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-70", "0"); // Brutal Hunter, [Empower] 3 Energy
    for (let i = 0; i < 3; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Body", exhausted: false });
    }

    const result = empowerInstance(ctx(game, "0"), {
      instanceId: unit.instanceId,
      energyRuneIds: ["r0", "r1", "r2"],
    });

    expect(result).toBeUndefined();
    expect(unit.statuses.empowered).toBe(true);
    expect(unit.statuses.everEmpowered).toBe(true);
    for (const id of ["r0", "r1", "r2"]) {
      expect(game.players["0"].runePool.find((r) => r.instanceId === id)!.exhausted).toBe(true);
    }
    expect(computeMight(game, getCard, unit, "none")).toBe((getCard(unit.cardId).might ?? 0) + 2);
  });

  it("pays an Energy+Rune-domain cost, recycling the power rune", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-14", "0"); // Shadow Fiend, [Empower] 2 Energy+Fury Rune
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Body", exhausted: false },
      { instanceId: "e1", domain: "Body", exhausted: false },
      { instanceId: "p0", domain: "Fury", exhausted: false },
    );

    const result = empowerInstance(ctx(game, "0"), {
      instanceId: unit.instanceId,
      energyRuneIds: ["e0", "e1"],
      powerRuneId: "p0",
    });

    expect(result).toBeUndefined();
    expect(unit.statuses.empowered).toBe(true);
    expect(game.players["0"].runePool.find((r) => r.instanceId === "p0")).toBeUndefined();
    expect(game.players["0"].runeDeck.some((r) => r.instanceId === "p0")).toBe(true);
  });

  it("pays a discard-only cost with no Energy", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-7", "0"); // Punching Poro, [Empower] Discard 1
    game.players["0"].hand = ["unit-doomed-recruit"];

    const result = empowerInstance(ctx(game, "0"), { instanceId: unit.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(unit.statuses.empowered).toBe(true);
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].trash).toEqual(["unit-doomed-recruit"]);
  });

  it("rejects a second attempt once already ever-Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-70", "0");
    unit.statuses.everEmpowered = true;
    for (let i = 0; i < 3; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Body", exhausted: false });
    }

    const result = empowerInstance(ctx(game, "0"), {
      instanceId: unit.instanceId,
      energyRuneIds: ["r0", "r1", "r2"],
    });

    expect(result).toBe(INVALID_MOVE);
    expect(unit.statuses.empowered).toBeFalsy();
  });

  it("rejects a card with no empowerCost", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-plain-footman", "0");

    const result = empowerInstance(ctx(game, "0"), { instanceId: unit.instanceId, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects insufficient Energy", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-70", "0");

    const result = empowerInstance(ctx(game, "0"), { instanceId: unit.instanceId, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
    expect(unit.statuses.empowered).toBeFalsy();
  });
});
