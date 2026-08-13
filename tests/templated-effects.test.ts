import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { fireTemplatedEffect } from "../src/game/templatedEffectEngine";
import { resolveCombat, resolveHoldTriggers } from "../src/game/combat";
import { playCard } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as Parameters<typeof playCard>[0];
}

function moveToBattlefield(game: ReturnType<typeof makeGame>, instanceId: string, battlefieldIndex: number) {
  const instance = game.instances[instanceId];
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  game.battlefields[battlefieldIndex].units[instance.controller].push(instanceId);
}

describe("templated effects — auto-matched real cards", () => {
  it("Ahri, Alluring (onHold -> scorePoints): scores a point at the controller's Beginning step", () => {
    const game = makeGame();
    const ahri = putOnBase(game, "ogn-66", "0");
    moveToBattlefield(game, ahri.instanceId, 0);
    game.battlefields[0].controller = "0";

    resolveHoldTriggers(game, getCard, "0");

    expect(game.players["0"].points).toBe(1);
  });

  it("Anivia, Primal (onAttack -> dealDamage 3 to all enemies here): sweeps the battlefield when it attacks", () => {
    const game = makeGame();
    const anivia = putOnBase(game, "ogn-148", "0");
    const enemyA = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    const enemyB = putOnBase(game, "unit-plain-guard", "1"); // Might 1
    moveToBattlefield(game, anivia.instanceId, 0);
    moveToBattlefield(game, enemyA.instanceId, 0);
    moveToBattlefield(game, enemyB.instanceId, 0);

    fireTemplatedEffect(game, getCard, getCard(anivia.cardId), anivia, "onAttack");

    expect(game.instances[enemyA.instanceId]).toBeUndefined();
    expect(game.instances[enemyB.instanceId]).toBeUndefined();
  });

  it("Ahri, Inquisitive (onAttackOrDefend -> debuff an enemy here): fires on both attack and defend", () => {
    const game = makeGame();
    const ahri = putOnBase(game, "ogn-119", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1"); // Might 2
    moveToBattlefield(game, ahri.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);
    const card = getCard(ahri.cardId);

    fireTemplatedEffect(game, getCard, card, ahri, "onAttack");
    expect(enemy.tempMightBonus).toBe(-2);

    fireTemplatedEffect(game, getCard, card, ahri, "onDefend");
    expect(enemy.tempMightBonus).toBe(-4);

    // Does not fire for an unrelated trigger.
    fireTemplatedEffect(game, getCard, card, ahri, "onConquer");
    expect(enemy.tempMightBonus).toBe(-4);
  });

  it("Cloud Drake (onPlay -> draw 1): drawing works through the real playCard move", () => {
    const game = makeGame();
    game.players["0"].hand = ["ven-48"];
    game.players["0"].mainDeck = ["unit-plain-footman"];
    const card = getCard("ven-48");
    game.players["0"].runePool = Array.from({ length: card.energyCost ?? 0 }, (_, i) => ({
      instanceId: `r${i}`,
      domain: card.domains[0] ?? "Fury",
      exhausted: false,
    }));

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: game.players["0"].runePool.map((r) => r.instanceId),
      powerRuneIds: [],
    });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand).toContain("unit-plain-footman");
  });

  it("Grim Apothecary (onPlay -> recall a friendly unit): returns the chosen unit to hand", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-plain-footman", "0");
    const apothecary = putOnBase(game, "unl-21", "0");

    fireTemplatedEffect(game, getCard, getCard(apothecary.cardId), apothecary, "onPlay", target.instanceId);

    expect(game.instances[target.instanceId]).toBeUndefined();
    expect(game.players["0"].hand).toContain("unit-plain-footman");
    expect(game.players["0"].base).not.toContain(target.instanceId);
  });

  it("Vengeance (onPlay -> kill a unit): destroys the chosen unit outright, regardless of Might", () => {
    const game = makeGame();
    const tough = putOnBase(game, "unit-plain-footman", "1");
    const vengeance = putOnBase(game, "ogn-229", "0");

    fireTemplatedEffect(game, getCard, getCard(vengeance.cardId), vengeance, "onPlay", tough.instanceId);

    expect(game.instances[tough.instanceId]).toBeUndefined();
    expect(game.players["1"].trash).toContain("unit-plain-footman");
  });

  it("Startipped Peak (onHold -> channelRunes 1): channels an extra Rune when held", () => {
    const game = makeGame();
    game.players["0"].runeDeck = [{ instanceId: "r1", domain: "Fury", exhausted: false }];
    const bfCard = getCard("ogn-288");
    // Battlefields have no CardInstance of their own; simulate via a unit standing on a controlled battlefield.
    const dummyController = putOnBase(game, "unit-plain-footman", "0");
    moveToBattlefield(game, dummyController.instanceId, 0);
    game.battlefields[0].controller = "0";
    game.battlefields[0].cardId = "ogn-288";

    fireTemplatedEffect(game, getCard, bfCard, dummyController, "onHold");

    expect(game.players["0"].runePool).toHaveLength(1);
  });

  it("does not fire an effect whose trigger doesn't match", () => {
    const game = makeGame();
    const ahri = putOnBase(game, "ogn-66", "0"); // onHold only
    moveToBattlefield(game, ahri.instanceId, 0);
    game.battlefields[0].controller = "0";

    fireTemplatedEffect(game, getCard, getCard(ahri.cardId), ahri, "onAttack");

    expect(game.players["0"].points).toBe(0);
  });
});

describe("templated effects — full attack integration via resolveCombat", () => {
  it("Anivia's onAttack sweep applies before the main combat damage step", () => {
    const game = makeGame();
    const anivia = putOnBase(game, "ogn-148", "0"); // Might of Anivia herself, unknown but > 0
    const enemy = putOnBase(game, "unit-plain-guard", "1"); // Might 1, dies to the 3-damage sweep
    moveToBattlefield(game, anivia.instanceId, 0);
    moveToBattlefield(game, enemy.instanceId, 0);

    fireTemplatedEffect(game, getCard, getCard(anivia.cardId), anivia, "onAttack");
    resolveCombat(game, getCard, 0, "0");

    expect(game.instances[enemy.instanceId]).toBeUndefined();
    expect(game.battlefields[0].controller).toBe("0");
  });
});
