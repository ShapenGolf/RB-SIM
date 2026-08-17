import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Swain, Visionary (ven-173 / ven-65)", () => {
  it("scores 1 point on conquer if a non-token unit, gear, and spell were all played this turn", () => {
    const game = makeGame();
    const swain = putOnBase(game, "ven-173", "0");
    game.players["0"].playedNonTokenUnitThisTurn = true;
    game.players["0"].playedNonTokenGearThisTurn = true;
    game.players["0"].playedSpellThisTurn = true;
    const card = getCard(swain.cardId);

    SpecialCaseEngine.onConquer(game, card, swain, 0);

    expect(game.players["0"].points).toBe(1);
  });

  it("doesn't score if one condition is missing", () => {
    const game = makeGame();
    const swain = putOnBase(game, "ven-173", "0");
    game.players["0"].playedNonTokenUnitThisTurn = true;
    game.players["0"].playedNonTokenGearThisTurn = true;
    const card = getCard(swain.cardId);

    SpecialCaseEngine.onConquer(game, card, swain, 0);

    expect(game.players["0"].points).toBe(0);
  });

  it("shares the same handler between both reprints", () => {
    expect(getCard("ven-173").specialCaseId).toBe(getCard("ven-65").specialCaseId);
  });
});

describe("Swift Scout (ogn-307 / ogn-263)", () => {
  it("returns a friendly Teemo unit to hand on activation", () => {
    const game = makeGame();
    const scout = putOnBase(game, "ogn-307", "0");
    const teemo = putOnBase(game, "sfd-230", "0"); // Teemo, Strategist
    const card = getCard(scout.cardId);

    SpecialCaseEngine.onActivate(game, card, scout);

    expect(game.instances[teemo.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("sfd-230");
  });

  it("shares the same handler between both reprints", () => {
    expect(getCard("ogn-307").specialCaseId).toBe(getCard("ogn-263").specialCaseId);
  });

  it("pulls a Teemo Chosen Champion from the Champion Zone before searching the board", () => {
    const game = makeGame();
    const scout = putOnBase(game, "ogn-307", "0");
    const boardTeemo = putOnBase(game, "sfd-230", "0"); // Teemo, Strategist
    game.players["0"].championZone = "ogn-197"; // Teemo, Scout — also tagged Teemo
    const card = getCard(scout.cardId);

    SpecialCaseEngine.onActivate(game, card, scout);

    expect(game.players["0"].championZone).toBeNull();
    expect(game.players["0"].hand).toContain("ogn-197");
    // The board Teemo is left alone — the Champion Zone copy was preferred.
    expect(game.instances[boardTeemo.instanceId]).toBeDefined();
  });
});
