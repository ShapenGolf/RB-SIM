import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import { getCard } from "../src/cards/db";
import { empowerInstance } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Mel, Defiant Soul (ven-188 / ven-110)", () => {
  it("shares the same handler across both reprints", () => {
    expect(getCard("ven-188").specialCaseId).toBe("mel-defiant-soul");
    expect(getCard("ven-110").specialCaseId).toBe("mel-defiant-soul");
  });

  it("discards a spell to empower and banishes the strongest qualifying enemy unit", () => {
    const game = makeGame();
    const mel = putOnBattlefield(game, "ven-188", "0", 0);
    const weak = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const strongEligible = putOnBattlefield(game, "unit-elusive-warden", "1", 0); // Might 3, at the threshold
    const tooStrong = putOnBattlefield(game, "unit-blazing-scorcher", "1", 1); // Might 3 base, pushed above threshold
    tooStrong.tempMightBonus = 2; // effective Might 5 — excluded from "3 Might or less"
    game.players["0"].hand = ["spell-dangerous-duo", "unit-doomed-recruit"];

    const result = empowerInstance(ctx(game, "0"), { instanceId: mel.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(mel.statuses.empowered).toBe(true);
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
    expect(game.players["0"].trash).toContain("spell-dangerous-duo");
    expect(game.instances[strongEligible.instanceId]).toBeUndefined();
    expect(game.players["1"].banishment).toContain("unit-elusive-warden");
    expect(game.instances[weak.instanceId]).toBeDefined();
    expect(game.instances[tooStrong.instanceId]).toBeDefined();
  });

  it("rejects the empower move if there's no spell in hand", () => {
    const game = makeGame();
    const mel = putOnBattlefield(game, "ven-188", "0", 0);
    game.players["0"].hand = ["unit-doomed-recruit"];

    const result = empowerInstance(ctx(game, "0"), { instanceId: mel.instanceId, energyRuneIds: [] });

    expect(result).toBe(INVALID_MOVE);
    expect(mel.statuses.empowered).toBeUndefined();
  });

  it("does nothing if no enemy unit qualifies (all above the Might threshold)", () => {
    const game = makeGame();
    const mel = putOnBattlefield(game, "ven-188", "0", 0);
    const tooStrong = putOnBattlefield(game, "unit-blazing-scorcher", "1", 1);
    tooStrong.tempMightBonus = 2; // effective Might 5
    game.players["0"].hand = ["spell-dangerous-duo"];

    const result = empowerInstance(ctx(game, "0"), { instanceId: mel.instanceId, energyRuneIds: [] });

    expect(result).toBeUndefined();
    expect(game.instances[tooStrong.instanceId]).toBeDefined();
  });
});
