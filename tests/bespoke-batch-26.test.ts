import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { empowerInstance } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("Escaped Grayback (ven-124)", () => {
  it("kills the weakest other friendly unit to Empower, for no Energy", () => {
    const game = makeGame();
    const grayback = putOnBase(game, "ven-124", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");

    const result = empowerInstance(ctx(game, "0"), { instanceId: grayback.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(grayback.statuses.empowered).toBe(true);
    expect(game.instances[weak.instanceId]).toBeUndefined();
    expect(game.instances[strong.instanceId]).toBeDefined();
  });

  it("rejects the Empower attempt if no other friendly unit exists to kill", () => {
    const game = makeGame();
    const grayback = putOnBase(game, "ven-124", "0");

    const result = empowerInstance(ctx(game, "0"), { instanceId: grayback.instanceId, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
    expect(grayback.statuses.empowered).toBeFalsy();
  });

  it("has +2 Might once Empowered", () => {
    const game = makeGame();
    const grayback = putOnBase(game, "ven-124", "0");
    const card = getCard(grayback.cardId);
    expect(SpecialCaseEngine.staticMightModifier(game, card, grayback)).toBe(0);
    grayback.statuses.empowered = true;
    expect(SpecialCaseEngine.staticMightModifier(game, card, grayback)).toBe(2);
  });
});

describe("Kharox (ven-114)", () => {
  it("burns the opponent's deck 3 and plays a unit from their trash on becoming Empowered", () => {
    const game = makeGame();
    const kharoxInst = putOnBase(game, "ven-114", "0");
    game.players["1"].mainDeck = ["unit-doomed-recruit", "token-tentacle", "token-shadow-clone"];
    game.players["0"].runePool.push(
      ...Array.from({ length: 6 }, (_, i) => ({ instanceId: `e${i}`, domain: "Body" as const, exhausted: false })),
      { instanceId: "p0", domain: "Chaos" as const, exhausted: false },
    );

    const result = empowerInstance(ctx(game, "0"), {
      instanceId: kharoxInst.instanceId,
      energyRuneIds: ["e0", "e1", "e2", "e3", "e4", "e5"],
      powerRuneId: "p0",
    });

    expect(result).toBeUndefined();
    expect(game.players["1"].mainDeck).toEqual([]);
    const played = Object.values(game.instances).find((i) => i.controller === "0" && i.cardId === "unit-doomed-recruit");
    expect(played).toBeDefined();
  });
});

describe("Consuming Curse (ven-10)", () => {
  it("deals 2 plus 1 bonus per same-named card in trash to the weakest enemy at a battlefield", () => {
    const game = makeGame();
    const curse = putOnBase(game, "ven-10", "0");
    game.players["0"].trash = ["ven-10", "ven-10"];
    const instance = putOnBase(game, "unit-doomed-recruit", "1");
    instance.zone = "battlefield";
    instance.battlefieldIndex = 0;
    game.battlefields[0].units["1"].push(instance.instanceId);
    const card = getCard(curse.cardId);

    SpecialCaseEngine.onPlay(game, card, curse);
    expect(game.instances[instance.instanceId]).toBeUndefined();
  });

  it("ignores enemy units in base (not at a battlefield)", () => {
    const game = makeGame();
    const curse = putOnBase(game, "ven-10", "0");
    const inBase = putOnBase(game, "unit-doomed-recruit", "1");
    const card = getCard(curse.cardId);

    SpecialCaseEngine.onPlay(game, card, curse);
    expect(game.instances[inBase.instanceId]).toBeDefined();
    expect(game.instances[inBase.instanceId].damage).toBe(0);
  });
});
