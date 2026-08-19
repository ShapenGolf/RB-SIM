import { describe, it, expect, vi } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { playCard } from "../src/game/moves";
import { getCard } from "../src/cards/db";
import { makeGame, putOnBase } from "./helpers";
import { createInstance } from "../src/game/setup";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  return { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof playCard>[0];
}

function fundRunePool(game: GameState, playerId: "0" | "1", energy: number, power: { domain: string; amount: number }[] = []) {
  const runes = Array.from({ length: energy }, (_, i) => ({ instanceId: `e${playerId}-${i}`, domain: "Mind" as const, exhausted: false }));
  let seq = 0;
  for (const p of power) {
    for (let i = 0; i < p.amount; i += 1) {
      runes.push({ instanceId: `p${playerId}-${p.domain}-${seq}`, domain: p.domain as never, exhausted: false });
      seq += 1;
    }
  }
  game.players[playerId].runePool = runes;
}
function energyIds(game: GameState, playerId: "0" | "1", n: number) {
  return game.players[playerId].runePool.filter((r) => r.domain === "Mind").slice(0, n).map((r) => r.instanceId);
}

/**
 * [Repeat] (rule 820): an optional additional cost that, if paid, executes the spell's onPlay
 * effect a second time. cards/db.ts's parseRepeatCost derives Card.repeatCost from the "repeat"
 * keyword's grantedText for the common "N Energy" / "<Domain> Rune" shapes.
 */
describe("[Repeat] (rule 820)", () => {
  it("parses the common cost shapes from card data", () => {
    expect(getCard("sfd-34").repeatCost).toEqual({ energy: 2 }); // Feral Strength: [Repeat] 2 Energy
    expect(getCard("sfd-80").repeatCost).toEqual({ energy: 1, runeDomain: "Mind" }); // Bellows Breath: [Repeat] 1 EnergyMind Rune
    expect(getCard("sfd-122").repeatCost).toEqual({ energy: 0, runeDomain: "Chaos" }); // Called Shot: [Repeat] Chaos Rune
  });

  it("Feral Strength (sfd-34): without paying Repeat, +2 Might is applied once", () => {
    const game = makeGame();
    game.players["0"].hand = ["sfd-34"];
    fundRunePool(game, "0", 2);
    const target = putOnBase(game, "unit-plain-footman", "0");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 2),
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
    });

    expect(result).toBeUndefined();
    expect(target.tempMightBonus).toBe(2);
  });

  it("Feral Strength (sfd-34): paying the Repeat cost applies +2 Might TWICE (same target both times)", () => {
    const game = makeGame();
    game.players["0"].hand = ["sfd-34"];
    fundRunePool(game, "0", 4); // base cost (2) + repeat cost (2)
    const target = putOnBase(game, "unit-plain-footman", "0");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 2),
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
      payRepeatCost: true,
      repeatEnergyRuneIds: game.players["0"].runePool.slice(-2).map((r) => r.instanceId),
    });

    expect(result).toBeUndefined();
    expect(target.tempMightBonus).toBe(4);
  });

  it("rejects paying Repeat with the wrong number of runes", () => {
    const game = makeGame();
    game.players["0"].hand = ["sfd-34"];
    fundRunePool(game, "0", 4);
    const target = putOnBase(game, "unit-plain-footman", "0");

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: energyIds(game, "0", 2),
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
      payRepeatCost: true,
      repeatEnergyRuneIds: [], // needs 2
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects trying to pay Repeat with the SAME rune already spent on the base cost", () => {
    const game = makeGame();
    game.players["0"].hand = ["sfd-34"];
    fundRunePool(game, "0", 2); // only enough for the base cost, none left over
    const target = putOnBase(game, "unit-plain-footman", "0");
    const baseIds = energyIds(game, "0", 2);

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: baseIds,
      powerRuneIds: [],
      targetInstanceId: target.instanceId,
      payRepeatCost: true,
      repeatEnergyRuneIds: baseIds, // reusing the same physical runes
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects paying Repeat on a card with no repeatCost at all", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"]; // no [Repeat]
    fundRunePool(game, "0", 2);

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: [],
      powerRuneIds: [],
      payRepeatCost: true,
      repeatEnergyRuneIds: [],
    });

    expect(result).toBe(INVALID_MOVE);
  });

  it("Bellows Breath (sfd-80): a [Repeat] cost with both Energy and a Rune domain", () => {
    // Bellows Breath ([Action] Deal 1 to up to three units at the same location) auto-picks the
    // enemy-occupied battlefield with the most units (src/cards/special-cases/bellows-breath.ts) —
    // no player-chosen target, so no targetInstanceId is passed here.
    const game = makeGame();
    game.players["0"].hand = ["sfd-80"];
    const card = getCard("sfd-80");
    // Base cost: 1 Energy + 1 Mind Power rune. Repeat cost ("1 EnergyMind Rune"): 1 more Energy
    // rune + 1 more Mind Power rune.
    fundRunePool(game, "0", (card.energyCost ?? 0) + card.repeatCost!.energy, [
      ...card.powerCost.map((p) => ({ domain: p.domain, amount: p.amount })),
      { domain: "Mind", amount: 1 }, // extra Mind Power rune for the Repeat cost
    ]);
    const enemy = createInstance(game, "unit-plain-footman", "1");
    game.battlefields[0].units["1"].push(enemy.instanceId);

    const baseEnergyIds = energyIds(game, "0", card.energyCost ?? 0);
    const repeatEnergyIds = game.players["0"].runePool
      .filter((r) => r.domain === "Mind" && !baseEnergyIds.includes(r.instanceId))
      .slice(0, card.repeatCost!.energy)
      .map((r) => r.instanceId);
    const basePowerIds = game.players["0"].runePool
      .filter(
        (r) =>
          card.powerCost.some((p) => p.domain === r.domain) &&
          !baseEnergyIds.includes(r.instanceId) &&
          !repeatEnergyIds.includes(r.instanceId),
      )
      .slice(0, card.powerCost.reduce((sum, p) => sum + p.amount, 0))
      .map((r) => r.instanceId);
    const repeatPowerRuneId = game.players["0"].runePool.find(
      (r) =>
        r.domain === "Mind" &&
        !basePowerIds.includes(r.instanceId) &&
        !baseEnergyIds.includes(r.instanceId) &&
        !repeatEnergyIds.includes(r.instanceId),
    )?.instanceId;

    const result = playCard(ctx(game, "0"), {
      handIndex: 0,
      energyRuneIds: baseEnergyIds,
      powerRuneIds: basePowerIds,
      payRepeatCost: true,
      repeatEnergyRuneIds: repeatEnergyIds,
      repeatPowerRuneId,
    });

    expect(result).toBeUndefined();
    // 1 damage applied twice (base + repeat) — enough to kill the 2-Might footman, proving the
    // onPlay effect actually fired twice rather than once.
    expect(game.instances[enemy.instanceId]).toBeUndefined();
  });
});
