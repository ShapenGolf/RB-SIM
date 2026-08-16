import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Dancing Grenade (unl-20)", () => {
  it("deals 2 damage to the chosen unit", () => {
    const game = makeGame();
    const grenade = putOnBase(game, "unl-20", "0");
    const target = putOnBase(game, "unit-blazing-scorcher", "1"); // Might 3
    const card = getCard(grenade.cardId);

    SpecialCaseEngine.onPlay(game, card, grenade, target.instanceId);

    expect(target.damage).toBe(2);
    expect(game.instances[target.instanceId]).toBeDefined();
  });

  it("kills a unit with toughness 2 or less", () => {
    const game = makeGame();
    const grenade = putOnBase(game, "unl-20", "0");
    const target = putOnBase(game, "unit-doomed-recruit", "1"); // Might 1
    const card = getCard(grenade.cardId);

    SpecialCaseEngine.onPlay(game, card, grenade, target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
  });

  it("does nothing without a target", () => {
    const game = makeGame();
    const grenade = putOnBase(game, "unl-20", "0");
    const card = getCard(grenade.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, grenade)).not.toThrow();
  });
});

describe("Moot no-op registrations (batch 93)", () => {
  const cases: [string, string][] = [
    ["ogn-227", "symbol-of-the-solari"],
    ["ven-160", "mystic-vortex"],
    ["sfd-15", "perched-grimwyrm"],
    ["ogn-111", "heimerdinger-inventor"],
    ["sfd-59", "svellsongur"],
    ["ven-137", "shady-spectacles"],
    ["sfd-90", "the-zero-drive"],
    ["ven-134", "kayle-justified"],
    ["ven-185", "kayle-justified"],
    ["ogn-236", "karthus-eternal"],
    ["unl-226", "virtuoso"],
    ["unl-181", "virtuoso"],
    ["unl-25", "undying-legion"],
  ];

  for (const [cardId, specialCaseId] of cases) {
    it(`${cardId} resolves to the ${specialCaseId} handler`, () => {
      expect(getCard(cardId).specialCaseId).toBe(specialCaseId);
    });
  }
});
