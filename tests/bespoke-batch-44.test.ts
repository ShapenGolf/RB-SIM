import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Illaoi, Prophet of the Great Kraken (ven-182)", () => {
  it("plays a Tentacle token when played", () => {
    const game = makeGame();
    const illaoi = putOnBase(game, "ven-182", "0");
    const card = getCard(illaoi.cardId);

    SpecialCaseEngine.onPlay(game, card, illaoi);
    const tentacle = Object.values(game.instances).find((i) => i.cardId === "token-tentacle");
    expect(tentacle).toBeDefined();
    expect(game.players["0"].base).toContain(tentacle?.instanceId);
  });

  it("has +1 Might for each token unit the controller controls", () => {
    const game = makeGame();
    const illaoi = putOnBase(game, "ven-182", "0");
    const card = getCard(illaoi.cardId);
    expect(SpecialCaseEngine.staticMightModifier(game, card, illaoi)).toBe(0);

    putOnBase(game, "token-tentacle", "0");
    putOnBase(game, "token-shadow-clone", "0");
    expect(SpecialCaseEngine.staticMightModifier(game, card, illaoi)).toBe(2);

    // A non-token real card and an enemy token shouldn't count.
    putOnBase(game, "unit-doomed-recruit", "0");
    putOnBase(game, "token-tentacle", "1");
    expect(SpecialCaseEngine.staticMightModifier(game, card, illaoi)).toBe(2);
  });
});
