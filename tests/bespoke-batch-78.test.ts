import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { dealSpellDamage } from "../src/game/spellDamage";
import { resolveCombat } from "../src/game/combat";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Ki Barrier (ven-126)", () => {
  it("gives the strongest friendly unit a 7-damage prevention pool", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ven-126", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(strong.damagePreventionPool).toBe(7);
    expect(weak.damagePreventionPool).toBe(0);
  });

  it("absorbs spell damage up to the pool, then lets the rest through", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-blazing-scorcher", "0");
    unit.damagePreventionPool = 7;

    dealSpellDamage(game, getCard, unit.instanceId, 5, "1");
    expect(unit.damage).toBe(0);
    expect(unit.damagePreventionPool).toBe(2);

    dealSpellDamage(game, getCard, unit.instanceId, 5, "1");
    expect(unit.damage).toBe(3);
    expect(unit.damagePreventionPool).toBe(0);
  });

  it("absorbs combat damage too, saving a unit that would otherwise die", () => {
    const game = makeGame();
    // unit-doomed-recruit has 1 Might/toughness; without prevention, a Might-3 attacker kills it.
    const defender = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    defender.damagePreventionPool = 7;
    const attacker = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    attacker.exhausted = true;

    resolveCombat(game, getCard, 0, "1");

    expect(game.instances[defender.instanceId]).toBeDefined();
    // Damage assigned to a single defender is capped at its own toughness (1), not the
    // attacker's full Might — the rest becomes "excess damage" for conquer triggers.
    expect(defender.damagePreventionPool).toBe(6);
  });
});
