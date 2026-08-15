import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { empowerInstance } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("Tail-Cloaked Matriarch (ven-104)", () => {
  it("plays a <=3 Energy unit from trash ignoring cost when it becomes Empowered", () => {
    const game = makeGame();
    const matriarch = putOnBase(game, "ven-104", "0");
    game.players["0"].trash = ["unit-doomed-recruit"];
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Body", exhausted: false },
      { instanceId: "e1", domain: "Body", exhausted: false },
      { instanceId: "p0", domain: "Chaos", exhausted: false },
    );

    const result = empowerInstance(ctx(game, "0"), {
      instanceId: matriarch.instanceId,
      energyRuneIds: ["e0", "e1"],
      powerRuneId: "p0",
    });

    expect(result).toBeUndefined();
    expect(matriarch.statuses.empowered).toBe(true);
    expect(game.players["0"].trash).not.toContain("unit-doomed-recruit");
    expect(Object.values(game.instances).some((i) => i.cardId === "unit-doomed-recruit")).toBe(true);
  });
});

describe("Otterpus (ven-53)", () => {
  it("gates scoring-to-draw conversion on the scoring player's first or second turn", () => {
    const game = makeGame();
    putOnBase(game, "ven-53", "0");
    game.players["0"].turnsTaken = 1;
    expect(SpecialCaseEngine.scoringConvertedToDraw(game, getCard, "0")).toBe(true);

    game.players["0"].turnsTaken = 2;
    expect(SpecialCaseEngine.scoringConvertedToDraw(game, getCard, "0")).toBe(true);

    game.players["0"].turnsTaken = 3;
    expect(SpecialCaseEngine.scoringConvertedToDraw(game, getCard, "0")).toBe(false);
  });

  it("applies to either player's early-turn scoring, regardless of who controls Otterpus", () => {
    const game = makeGame();
    putOnBase(game, "ven-53", "0");
    game.players["1"].turnsTaken = 1;
    expect(SpecialCaseEngine.scoringConvertedToDraw(game, getCard, "1")).toBe(true);
  });

  it("has no effect once Otterpus is no longer in play", () => {
    const game = makeGame();
    game.players["0"].turnsTaken = 1;
    expect(SpecialCaseEngine.scoringConvertedToDraw(game, getCard, "0")).toBe(false);
  });
});

describe("Void Rush (sfd-188)", () => {
  it("plays the pricier <=2 Energy revealed card for free and draws the other", () => {
    const game = makeGame();
    const rush = putOnBase(game, "sfd-188", "0");
    game.players["0"].mainDeck = ["token-tentacle", "unit-doomed-recruit"];
    const card = getCard(rush.cardId);

    SpecialCaseEngine.onPlay(game, card, rush);
    expect(Object.values(game.instances).some((i) => i.cardId === "unit-doomed-recruit")).toBe(true);
    expect(game.players["0"].hand).toContain("token-tentacle");
  });

  it("just draws both if neither revealed card costs 2 Energy or less", () => {
    const game = makeGame();
    const rush = putOnBase(game, "sfd-188", "0");
    game.players["0"].mainDeck = ["unit-blazing-scorcher", "unit-elusive-warden"];
    const card = getCard(rush.cardId);

    SpecialCaseEngine.onPlay(game, card, rush);
    expect(game.players["0"].hand).toEqual(["unit-blazing-scorcher", "unit-elusive-warden"]);
  });
});
