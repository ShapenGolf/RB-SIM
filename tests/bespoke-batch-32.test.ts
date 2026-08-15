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

describe("Helm of Suppression (ven-45)", () => {
  it("makes an opponent's spell cost 1 Energy more", () => {
    const game = makeGame();
    putOnBase(game, "ven-45", "0");
    game.players["1"].hand = ["unit-doomed-recruit"]; // a spell fixture would be ideal; test cost math directly
    const spellCard = getCard("unit-doomed-recruit");
    const dummyInstance = putOnBase(game, "unit-doomed-recruit", "1");
    expect(SpecialCaseEngine.costIncreaseFromEnemies(game, getCard, dummyInstance, { ...spellCard, type: "spell" })).toBe(1);
  });

  it("has no effect on the controller's own spells", () => {
    const game = makeGame();
    putOnBase(game, "ven-45", "0");
    const spellCard = getCard("unit-doomed-recruit");
    const dummyInstance = putOnBase(game, "unit-doomed-recruit", "0");
    expect(SpecialCaseEngine.costIncreaseFromEnemies(game, getCard, dummyInstance, { ...spellCard, type: "spell" })).toBe(0);
  });

  it("doesn't affect non-spell cards", () => {
    const game = makeGame();
    putOnBase(game, "ven-45", "0");
    const unitCard = getCard("unit-doomed-recruit");
    const dummyInstance = putOnBase(game, "unit-doomed-recruit", "1");
    expect(SpecialCaseEngine.costIncreaseFromEnemies(game, getCard, dummyInstance, unitCard)).toBe(0);
  });

  it("actually raises the Energy needed via the real playCard move (base cost 2 -> 3)", () => {
    const game = makeGame();
    putOnBase(game, "ven-45", "1");
    game.players["0"].hand = ["spell-stunning-blow"];
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Calm", exhausted: false },
      { instanceId: "e1", domain: "Calm", exhausted: false },
      { instanceId: "e2", domain: "Calm", exhausted: false },
      { instanceId: "p0", domain: "Body", exhausted: false },
    );

    // Only the base 2 Energy: 1 short of the suppressed 3-Energy cost, should fail.
    const short = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0", "e1"],
      powerRuneIds: ["p0"],
    });
    expect(short).toBeTruthy();

    const full = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: ["e0", "e1", "e2"],
      powerRuneIds: ["p0"],
    });
    expect(full).toBeUndefined();
  });
});

describe("Fae Dragon (sfd-101)", () => {
  it("buffs up to 4 unbuffed friendly units", () => {
    const game = makeGame();
    const units = Array.from({ length: 5 }, () => putOnBase(game, "unit-doomed-recruit", "0"));
    const dragon = putOnBase(game, "sfd-101", "0");
    const card = getCard(dragon.cardId);

    SpecialCaseEngine.onPlay(game, card, dragon);
    const buffedCount = units.filter((u) => u.statuses.buffed).length;
    expect(buffedCount).toBe(4);
  });

  it("skips units that are already buffed", () => {
    const game = makeGame();
    const alreadyBuffed = putOnBase(game, "unit-doomed-recruit", "0");
    alreadyBuffed.statuses.buffed = true;
    const fresh = putOnBase(game, "token-tentacle", "0");
    const dragon = putOnBase(game, "sfd-101", "0");
    const card = getCard(dragon.cardId);

    SpecialCaseEngine.onPlay(game, card, dragon);
    expect(fresh.statuses.buffed).toBe(true);
  });
});
