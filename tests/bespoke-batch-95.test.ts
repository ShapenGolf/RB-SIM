import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Bottled Constellation (ven-67)", () => {
  it("kills the 3 weakest other eligible friendly units/gear and scores 1 point", () => {
    const game = makeGame();
    putOnBase(game, "ven-67", "0");
    const weak1 = putOnBase(game, "unit-doomed-recruit", "0"); // Might 1
    const weak2 = putOnBase(game, "unit-farsighted-scout", "0"); // Might 1
    const weak3 = putOnBase(game, "gear-tactical-banner", "0"); // Might 0 (gear)
    const strong = putOnBase(game, "unit-blazing-scorcher", "0"); // Might 3

    SpecialCaseEngine.onMainPhaseStart(game, getCard, "0");

    expect(game.instances[weak1.instanceId]).toBeUndefined();
    expect(game.instances[weak2.instanceId]).toBeUndefined();
    expect(game.instances[weak3.instanceId]).toBeUndefined();
    expect(game.instances[strong.instanceId]).toBeDefined();
    expect(game.players["0"].points).toBe(1);
  });

  it("does nothing if fewer than 3 other eligible units/gear exist", () => {
    const game = makeGame();
    putOnBase(game, "ven-67", "0");
    putOnBase(game, "unit-doomed-recruit", "0");

    SpecialCaseEngine.onMainPhaseStart(game, getCard, "0");

    expect(game.players["0"].points).toBe(0);
  });
});

describe("Bullet Time (ogn-268)", () => {
  it("spends the whole rune pool to deal that much damage to all enemy units at the most-populated battlefield", () => {
    const game = makeGame();
    const bullet = putOnBase(game, "ogn-268", "0");
    game.players["0"].runePool.push(
      { instanceId: "r0", domain: "Mind", exhausted: false },
      { instanceId: "r1", domain: "Mind", exhausted: false },
    );
    game.battlefields[0].units["1"] = [];
    const enemy1 = putOnBase(game, "unit-doomed-recruit", "1");
    game.players["1"].base = game.players["1"].base.filter((id) => id !== enemy1.instanceId);
    enemy1.zone = "battlefield";
    enemy1.battlefieldIndex = 0;
    game.battlefields[0].units["1"].push(enemy1.instanceId);
    const card = getCard(bullet.cardId);

    SpecialCaseEngine.onPlay(game, card, bullet);

    expect(game.players["0"].runePool.length).toBe(0);
    expect(game.instances[enemy1.instanceId]).toBeUndefined(); // Might 1, took 2 damage
  });

  it("does nothing with an empty rune pool", () => {
    const game = makeGame();
    const bullet = putOnBase(game, "ogn-268", "0");
    const card = getCard(bullet.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, bullet)).not.toThrow();
  });
});

describe("Jhin, Meticulous Killer (unl-89)", () => {
  it("sets pendingPredict on play", () => {
    const game = makeGame();
    const jhin = putOnBase(game, "unl-89", "0");
    const card = getCard(jhin.cardId);

    SpecialCaseEngine.onPlay(game, card, jhin);

    expect(game.players["0"].pendingPredict).toBe(true);
  });
});

describe("Karma, Channeler (sfd-237 / ogn-235)", () => {
  it("shares the same handler across both reprints and sets pendingPredict on play", () => {
    expect(getCard("sfd-237").specialCaseId).toBe("karma-channeler");
    expect(getCard("ogn-235").specialCaseId).toBe("karma-channeler");

    const game = makeGame();
    const karma = putOnBase(game, "sfd-237", "0");
    const card = getCard(karma.cardId);
    SpecialCaseEngine.onPlay(game, card, karma);
    expect(game.players["0"].pendingPredict).toBe(true);
  });
});

describe("Moot no-op registrations (batch 95)", () => {
  const cases: [string, string][] = [
    ["sfd-211", "marai-spire"],
    ["ven-161", "piltovan-forge"],
    ["ogn-101", "mushroom-pouch"],
    ["ogn-18", "noxus-saboteur"],
    ["unl-146", "syndra-transcendent"],
    ["unl-108", "wily-newtfish"],
    ["unl-215", "star-spring"],
    ["ven-164", "sandswept-tomb"],
    ["ven-163", "risen-altar"],
    ["sfd-146", "vex-cheerless"],
  ];

  for (const [cardId, specialCaseId] of cases) {
    it(`${cardId} resolves to the ${specialCaseId} handler`, () => {
      expect(getCard(cardId).specialCaseId).toBe(specialCaseId);
    });
  }
});
