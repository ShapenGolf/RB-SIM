import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { activateAbility, empowerInstance } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("Renekton, Brute (ven-177)", () => {
  it("boosts its own Might for 1 Energy, repeatably, and empowers itself at 10+ Might", () => {
    const game = makeGame();
    const renekton = putOnBase(game, "ven-177", "0");
    game.players["0"].runePool.push(
      ...Array.from({ length: 8 }, (_, i) => ({ instanceId: `e${i}`, domain: "Body" as const, exhausted: false })),
    );

    for (let i = 0; i < 8; i += 1) {
      const result = activateAbility(ctx(game, "0"), {
        instanceId: renekton.instanceId,
        energyRuneIds: [`e${i}`],
      });
      expect(result).toBeUndefined();
    }
    expect(renekton.statuses.empowered).toBe(true);
  });

  it("gains conditional Ganking once Empowered", () => {
    const game = makeGame();
    const renekton = putOnBase(game, "ven-177", "0");
    const card = getCard(renekton.cardId);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, renekton)).toBe(false);
    renekton.statuses.empowered = true;
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, renekton)).toBe(true);
  });
});

describe("Mel, Newly Awakened (ven-69)", () => {
  it("draws 1 when played", () => {
    const game = makeGame();
    const mel = putOnBase(game, "ven-69", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(mel.cardId);

    SpecialCaseEngine.onPlay(game, card, mel);
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
  });

  it("empowers for 3 Energy", () => {
    const game = makeGame();
    const mel = putOnBase(game, "ven-69", "0");
    game.players["0"].runePool.push(
      ...Array.from({ length: 3 }, (_, i) => ({ instanceId: `e${i}`, domain: "Body" as const, exhausted: false })),
    );

    const result = empowerInstance(ctx(game, "0"), {
      instanceId: mel.instanceId,
      energyRuneIds: ["e0", "e1", "e2"],
    });
    expect(result).toBeUndefined();
    expect(mel.statuses.empowered).toBe(true);
  });
});
