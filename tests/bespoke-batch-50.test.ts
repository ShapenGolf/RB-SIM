import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("Rumble, Hotheaded (sfd-26)", () => {
  it("gives friendly Mechs +1 Might while attacking", () => {
    const game = makeGame();
    putOnBase(game, "sfd-26", "0");
    const mech = putOnBase(game, "ogn-56", "0"); // Adaptatron, tagged Mech
    expect(SpecialCaseEngine.attackingMightBonusFromAllies(game, getCard, mech)).toBe(1);
  });

  it("doesn't affect non-Mech units", () => {
    const game = makeGame();
    putOnBase(game, "sfd-26", "0");
    const nonMech = putOnBase(game, "unit-doomed-recruit", "0");
    expect(SpecialCaseEngine.attackingMightBonusFromAllies(game, getCard, nonMech)).toBe(0);
  });
});

describe("Irelia, Graceful (sfd-141)", () => {
  it("reduces the cost of the controller's own spell that targets her by 1 Energy", () => {
    const game = makeGame();
    const irelia = putOnBase(game, "sfd-141", "0");
    game.players["0"].hand = ["spell-stunning-blow"];
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Body", exhausted: false },
      { instanceId: "p0", domain: "Body", exhausted: false },
    );
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    enemy.zone = "battlefield";
    enemy.battlefieldIndex = 0;
    game.battlefields[0].units["1"].push(enemy.instanceId);

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0"],
      powerRuneIds: ["p0"],
      targetInstanceId: irelia.instanceId,
    });
    expect(result).toBeUndefined();
  });

  it("doesn't reduce the cost of a spell targeting someone else", () => {
    const game = makeGame();
    putOnBase(game, "sfd-141", "0");
    game.players["0"].hand = ["spell-stunning-blow"];
    game.players["0"].runePool.push({ instanceId: "p0", domain: "Body", exhausted: false });
    const enemy = putOnBase(game, "unit-doomed-recruit", "1");
    enemy.zone = "battlefield";
    enemy.battlefieldIndex = 0;
    game.battlefields[0].units["1"].push(enemy.instanceId);

    // Only 1 Energy rune supplied, but the base cost (2) applies since the target isn't Irelia — should fail.
    game.players["0"].runePool.push({ instanceId: "e0", domain: "Body", exhausted: false });
    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0"],
      powerRuneIds: ["p0"],
      targetInstanceId: enemy.instanceId,
    });
    expect(result).toBeTruthy();
  });
});
