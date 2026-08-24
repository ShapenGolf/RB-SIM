import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { validateDeck, type DeckList } from "../src/cards/deckValidation";
import { KeywordEngine } from "../src/keywords/registry";
import { fireTemplatedEffect, runTemplatedActions } from "../src/game/templatedEffectEngine";
import { resolveHoldTriggers } from "../src/game/combat";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

/** Mirrors tests/templated-effects.test.ts's helper — moves a base instance onto a battlefield slot. */
function moveToBattlefield(game: GameState, instanceId: string, battlefieldIndex: number) {
  const instance = game.instances[instanceId];
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  game.battlefields[battlefieldIndex].units[instance.controller].push(instanceId);
}

// A legal 40-card deck for the new homebrew "Corvenna" class (see src/cards/data/homebrew-set.json) —
// exercises the same deck-building rules (docs/deck-building-rules.md) any real class must satisfy,
// reusing real official Rune/Battlefield cards (the class has no card pool gaps that force it).
const CORVENNA_DECK: DeckList = {
  legendId: "hb-corvenna-legend",
  chosenChampionId: "hb-corvenna-oracle-ash",
  mainDeck: [
    ...Array(3).fill("hb-corvenna-oracle-ash"),
    ...Array(3).fill("hb-ashbound-sentinel"),
    ...Array(3).fill("hb-fatewoven-skirmisher"),
    ...Array(3).fill("hb-hourglass-warden"),
    ...Array(3).fill("hb-splinterfate-raider"),
    ...Array(3).fill("hb-ashfall-prophet"),
    ...Array(3).fill("hb-dust-reaver"),
    ...Array(3).fill("hb-broken-oath-duelist"),
    ...Array(3).fill("hb-chronicle-binder"),
    ...Array(3).fill("hb-fractured-omen"),
    ...Array(3).fill("hb-cinder-verdict"),
    ...Array(2).fill("hb-echo-of-what-was"),
    ...Array(2).fill("hb-severed-thread"),
    ...Array(2).fill("hb-hourglass-blade"),
    ...Array(1).fill("hb-shard-of-the-unmade"),
  ],
  runeDeck: [...Array(6).fill("ogn-166"), ...Array(6).fill("ogn-214")], // Chaos Rune, Order Rune
  battlefields: ["unl-205", "unl-206", "ogn-275"], // Abandoned Hall, Altar of Blood, Altar to Unity
};

describe("Homebrew 'Corvenna' class — deck legality", () => {
  it("mainDeck has exactly 40 cards", () => {
    expect(CORVENNA_DECK.mainDeck.length).toBe(40);
  });

  it("validates as a legal deck with the real card database", () => {
    expect(validateDeck(CORVENNA_DECK)).toEqual([]);
  });

  it("the alternate Chosen Champion (Herald of the Fracture) is also legal as the chosen champion", () => {
    const deck: DeckList = { ...CORVENNA_DECK, chosenChampionId: "hb-corvenna-herald-fracture" };
    deck.mainDeck = deck.mainDeck.map((id) => (id === "hb-corvenna-oracle-ash" ? "hb-corvenna-herald-fracture" : id));
    expect(validateDeck(deck)).toEqual([]);
  });

  it("every homebrew card carries a sourceNote disclosing it as homebrew, not official", () => {
    const ids = [
      "hb-corvenna-legend",
      "hb-corvenna-oracle-ash",
      "hb-corvenna-herald-fracture",
      "hb-ashbound-sentinel",
      "hb-fatewoven-skirmisher",
      "hb-hourglass-warden",
      "hb-splinterfate-raider",
      "hb-ashfall-prophet",
      "hb-dust-reaver",
      "hb-broken-oath-duelist",
      "hb-chronicle-binder",
      "hb-fractured-omen",
      "hb-cinder-verdict",
      "hb-echo-of-what-was",
      "hb-severed-thread",
      "hb-hourglass-blade",
      "hb-shard-of-the-unmade",
    ];
    for (const id of ids) {
      expect(getCard(id).sourceNote?.toLowerCase()).toContain("homebrew");
    }
  });
});

describe("Homebrew 'Corvenna' class — mechanics", () => {
  it("Corvenna, Oracle of Ash: [Vision] flags a pending predict when played", () => {
    const game = makeGame();
    const corvenna = putOnBase(game, "hb-corvenna-oracle-ash", "0");

    KeywordEngine.fireOnPlay(game, getCard(corvenna.cardId), corvenna);

    expect(game.players["0"].pendingPredict).toBe(1);
  });

  it("Corvenna, Oracle of Ash: onHold scores 1 point", () => {
    const game = makeGame();
    const corvenna = putOnBase(game, "hb-corvenna-oracle-ash", "0");
    moveToBattlefield(game, corvenna.instanceId, 0);
    game.battlefields[0].controller = "0";

    resolveHoldTriggers(game, getCard, "0");

    expect(game.players["0"].points).toBe(1);
  });

  it("Corvenna, Herald of the Fracture: onPlay deals 3 to an enemy unit at a battlefield", () => {
    const game = makeGame();
    const herald = putOnBase(game, "hb-corvenna-herald-fracture", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, herald.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);

    fireTemplatedEffect(game, getCard, getCard(herald.cardId), herald, "onPlay");

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });

  it("Ashfall Prophet: onPlay draws a card", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-footman", "unit-plain-guard"];
    const prophet = putOnBase(game, "hb-ashfall-prophet", "0");

    fireTemplatedEffect(game, getCard, getCard(prophet.cardId), prophet, "onPlay");

    expect(game.players["0"].hand).toEqual(["unit-plain-footman"]);
    expect(game.players["0"].mainDeck).toEqual(["unit-plain-guard"]);
  });

  it("Dust Reaver: onDestroy deals 2 to an enemy unit at the same battlefield", () => {
    const game = makeGame();
    const reaver = putOnBase(game, "hb-dust-reaver", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, reaver.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);

    fireTemplatedEffect(game, getCard, getCard(reaver.cardId), reaver, "onDestroy");

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });

  it("Fractured Omen: onPlay readies a friendly unit", () => {
    const game = makeGame();
    const omen = putOnBase(game, "hb-fractured-omen", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });

    fireTemplatedEffect(game, getCard, getCard(omen.cardId), omen, "onPlay");

    expect(ally.exhausted).toBe(false);
  });

  it("Echo of What Was: onPlay recalls a friendly unit and draws a card", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-plain-guard"];
    const echo = putOnBase(game, "hb-echo-of-what-was", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");

    fireTemplatedEffect(game, getCard, getCard(echo.cardId), echo, "onPlay");

    expect(game.instances[ally.instanceId]).toBeUndefined();
    expect(game.players["0"].base).not.toContain(ally.instanceId);
    expect(game.players["0"].hand).toContain("unit-plain-footman");
    expect(game.players["0"].hand).toContain("unit-plain-guard");
  });

  it("Severed Thread: onPlay kills a unit at a battlefield", () => {
    const game = makeGame();
    const thread = putOnBase(game, "hb-severed-thread", "0");
    const enemy = putOnBase(game, "unit-plain-guard", "1");
    moveToBattlefield(game, enemy.instanceId, 0);

    fireTemplatedEffect(game, getCard, getCard(thread.cardId), thread, "onPlay");

    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });

  it("Hourglass Blade: activated ability buffs a friendly unit's Might permanently", () => {
    const game = makeGame();
    const blade = putOnBase(game, "hb-hourglass-blade", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0");
    const card = getCard(blade.cardId);
    expect(card.activatedAbility).toBeDefined();

    runTemplatedActions(game, getCard, blade, card.activatedAbility!.actions, ally.instanceId);

    expect(ally.statuses.buffed).toBe(true);
  });

  it("Shard of the Unmade: activated ability deals 1 to an enemy unit", () => {
    const game = makeGame();
    const shard = putOnBase(game, "hb-shard-of-the-unmade", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1"); // Might 2
    const card = getCard(shard.cardId);
    expect(card.activatedAbility).toBeDefined();

    runTemplatedActions(game, getCard, shard, card.activatedAbility!.actions, enemy.instanceId);

    expect(enemy.damage).toBe(1);
  });

  it("Hourglass Blade / Shard of the Unmade: equipCost matches the printed [Equip] keyword text", () => {
    expect(getCard("hb-hourglass-blade").equipCost).toEqual({ energy: 0, runeDomain: "Order" });
    expect(getCard("hb-shard-of-the-unmade").equipCost).toEqual({ energy: 1, runeDomain: "Chaos" });
  });
});
