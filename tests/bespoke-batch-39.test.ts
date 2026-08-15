import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { computeMight } from "../src/game/might";
import { activateLegendAbility } from "../src/game/moves";
import { resolveCombat } from "../src/game/combat";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Curator of the Sands (ven-192)", () => {
  it("exhausts to ready 2 runes when a 7+ Energy unit is played", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ven-192", exhausted: false };
    game.players["0"].runePool.push(
      { instanceId: "r0", domain: "Mind", exhausted: true },
      { instanceId: "r1", domain: "Mind", exhausted: true },
    );
    const bigCard = { ...getCard("unit-doomed-recruit"), energyCost: 7 };

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", bigCard, 1);
    expect(game.players["0"].runePool.every((r) => !r.exhausted)).toBe(true);
    expect(game.players["0"].legend?.exhausted).toBe(true);
  });
});

describe("Piltover Enforcer (unl-187)", () => {
  it("exhausts to ready the strongest exhausted friendly unit on a 3+ excess-damage conquest", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-187", exhausted: false };
    const weak = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const strong = putOnBase(game, "unit-blazing-scorcher", "0", { exhausted: true });
    // Two Might-3 attackers (total 6) vs a Might-1 defender: 5 excess damage, well past the
    // 3-damage threshold, and an unambiguous attacker win.
    putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    putOnBattlefield(game, "unit-elusive-warden", "0", 0);
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(strong.exhausted).toBe(false);
    expect(weak.exhausted).toBe(true);
    expect(game.players["0"].legend?.exhausted).toBe(true);
  });

  it("doesn't trigger on an unopposed conquest (0 excess damage)", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-187", exhausted: false };
    const exhausted = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(exhausted.exhausted).toBe(true);
    expect(game.players["0"].legend?.exhausted).toBe(false);
  });
});

describe("Purifier (sfd-183)", () => {
  it("gives +1 Might per attached Equipment while attacking", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-183", exhausted: false };
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    unit.equipment = ["fake-gear-1", "fake-gear-2"];

    expect(computeMight(game, getCard, unit, "attacking")).toBe((getCard(unit.cardId).might ?? 0) + 2);
    expect(computeMight(game, getCard, unit, "defending")).toBe(getCard(unit.cardId).might ?? 0);
  });
});

describe("Relentless Storm (ogn-300)", () => {
  it("exhausts to channel 1 rune when a Mighty (5+ Might) unit is played", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-300", exhausted: false };
    game.players["0"].runeDeck.push({ instanceId: "d0", domain: "Mind", exhausted: false });
    const mightyCard = { ...getCard("unit-blazing-scorcher"), might: 5 };

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", mightyCard, 1);
    expect(game.players["0"].runePool.length).toBe(1);
    expect(game.players["0"].legend?.exhausted).toBe(true);
  });

  it("doesn't trigger for a non-Mighty unit", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-300", exhausted: false };
    game.players["0"].runeDeck.push({ instanceId: "d0", domain: "Mind", exhausted: false });
    const weakCard = { ...getCard("unit-doomed-recruit"), might: 1 };

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", weakCard, 1);
    expect(game.players["0"].runePool.length).toBe(0);
  });
});

describe("Unforgiven (ogn-259)", () => {
  it("moves a friendly unit from base to the first battlefield", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-259", exhausted: false };
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Body", exhausted: false },
      { instanceId: "e1", domain: "Body", exhausted: false },
    );

    const result = activateLegendAbility(ctx(game, "0"), {
      energyRuneIds: ["e0", "e1"],
      targetInstanceId: unit.instanceId,
    });

    expect(result).toBeUndefined();
    expect(unit.zone).toBe("battlefield");
    expect(unit.battlefieldIndex).toBe(0);
  });

  it("moves a friendly unit from a battlefield back to base", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-259", exhausted: false };
    const unit = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    game.players["0"].runePool.push(
      { instanceId: "e0", domain: "Body", exhausted: false },
      { instanceId: "e1", domain: "Body", exhausted: false },
    );

    const result = activateLegendAbility(ctx(game, "0"), {
      energyRuneIds: ["e0", "e1"],
      targetInstanceId: unit.instanceId,
    });

    expect(result).toBeUndefined();
    expect(unit.zone).toBe("base");
  });
});
