import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { computeMight } from "../src/game/might";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Oasis Raider (ven-6)", () => {
  it("gets +2 Might and Ganking this turn when controlling fewer runes than the opponent at Beginning", () => {
    const game = makeGame();
    const raider = putOnBase(game, "ven-6", "0");
    game.players["1"].runePool.push({ instanceId: "r0", domain: "Fury", exhausted: false });
    const card = getCard(raider.cardId);

    SpecialCaseEngine.onBeginning(game, card, raider);

    expect(raider.tempMightBonus).toBe(2);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, raider)).toBe(true);
  });

  it("gets nothing without fewer runes", () => {
    const game = makeGame();
    const raider = putOnBase(game, "ven-6", "0");
    const card = getCard(raider.cardId);

    SpecialCaseEngine.onBeginning(game, card, raider);

    expect(raider.tempMightBonus).toBe(0);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, raider)).toBe(false);
  });
});

describe("Zed, Without a Sound (ven-112)", () => {
  it("plays a Shadow Clone token on conquer", () => {
    const game = makeGame();
    const zed = putOnBase(game, "ven-112", "0");
    const card = getCard(zed.cardId);

    SpecialCaseEngine.onConquer(game, card, zed, 0);

    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-shadow-clone");
    expect(tokenId).toBeDefined();
  });
});

describe("Noxian Emissary (ven-128)", () => {
  it("plays no tokens on death while not Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-128", "0");
    const card = getCard(unit.cardId);

    SpecialCaseEngine.onDestroy(game, card, unit);

    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-recruit");
    expect(tokens).toHaveLength(0);
  });

  it("plays two Recruit tokens on death while Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-128", "0");
    unit.statuses.empowered = true;
    const card = getCard(unit.cardId);

    SpecialCaseEngine.onDestroy(game, card, unit);

    const tokens = game.players["0"].base.filter((id) => game.instances[id].cardId === "token-recruit");
    expect(tokens).toHaveLength(2);
  });
});

describe("Forgotten Relic (ven-108)", () => {
  it("burns the top card and buffs the strongest ready friendly unit if it was a unit", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-blazing-scorcher"]; // Might 3
    const relic = putOnBase(game, "ven-108", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0"); // Might 1
    const strong = putOnBase(game, "unit-plain-footman", "0"); // Might 2
    const card = getCard(relic.cardId);

    SpecialCaseEngine.onPlay(game, card, relic);

    expect(game.players["0"].trash).toEqual(["unit-blazing-scorcher"]);
    expect(strong.tempMightBonus).toBe(3);
    expect(weak.tempMightBonus).toBe(0);
  });

  it("burns without buffing if the burned card isn't a unit", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["gear-tactical-banner"];
    const relic = putOnBase(game, "ven-108", "0");
    const unit = putOnBase(game, "unit-plain-footman", "0");
    const card = getCard(relic.cardId);

    SpecialCaseEngine.onPlay(game, card, relic);

    expect(game.players["0"].trash).toEqual(["gear-tactical-banner"]);
    expect(unit.tempMightBonus).toBe(0);
  });
});

describe("Ambessa, The Wolf (ven-84)", () => {
  it("has no bonus while not Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-84", "0");

    expect(computeMight(game, getCard, unit, "none")).toBe(getCard(unit.cardId).might ?? 0);
  });

  it("has +3 Might once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-84", "0");
    unit.statuses.empowered = true;

    expect(computeMight(game, getCard, unit, "none")).toBe((getCard(unit.cardId).might ?? 0) + 3);
  });
});

describe("Zed, From the Shadows (ven-23, reused zed-from-the-shadows handler)", () => {
  it("resolves to the shared handler", () => {
    const card = getCard("ven-23");
    expect(card.specialCaseId).toBe("zed-from-the-shadows");
  });
});
