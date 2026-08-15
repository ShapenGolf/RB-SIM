import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { activateAbility } from "../src/game/moves";
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

describe("Janna, Savior (sfd-53)", () => {
  it("heals friendly units here and bounces the strongest enemy unit here", () => {
    const game = makeGame();
    const friendly = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    friendly.damage = 1;
    const weakEnemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const strongEnemy = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    const janna = putOnBattlefield(game, "sfd-53", "0", 0);
    const card = getCard(janna.cardId);

    SpecialCaseEngine.onPlay(game, card, janna);
    expect(friendly.damage).toBe(0);
    expect(strongEnemy.zone).toBe("base");
    expect(weakEnemy.zone).toBe("battlefield");
  });

  it("does nothing when played to base instead of a battlefield", () => {
    const game = makeGame();
    const janna = putOnBase(game, "sfd-53", "0");
    const card = getCard(janna.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, janna)).not.toThrow();
  });
});

describe("Renata Glasc, Mastermind (sfd-88)", () => {
  it("draws 1 for 1 Energy + Mind Rune, repeatably (no exhaust)", () => {
    const game = makeGame();
    const renata = putOnBattlefield(game, "sfd-88", "0", 0);
    game.players["0"].mainDeck = ["unit-doomed-recruit", "token-tentacle"];
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Body", exhausted: false },
      { instanceId: "p0", domain: "Mind", exhausted: false },
      { instanceId: "e1", domain: "Body", exhausted: false },
      { instanceId: "p1", domain: "Mind", exhausted: false },
    );

    const first = activateAbility(ctx(game, "0"), {
      instanceId: renata.instanceId,
      energyRuneIds: ["e0"],
      powerRuneId: "p0",
    });
    expect(first).toBeUndefined();
    expect(renata.exhausted).toBe(false);

    const second = activateAbility(ctx(game, "0"), {
      instanceId: renata.instanceId,
      energyRuneIds: ["e1"],
      powerRuneId: "p1",
    });
    expect(second).toBeUndefined();
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit", "token-tentacle"]);
  });
});
