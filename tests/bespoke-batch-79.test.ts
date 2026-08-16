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

describe("Lotus Trap (unl-13)", () => {
  it("doubles the strongest enemy unit's damageMultiplier", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-13", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "1");
    const strong = putOnBase(game, "unit-blazing-scorcher", "1");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(strong.damageMultiplier).toBe(2);
    expect(weak.damageMultiplier).toBe(1);
  });

  it("doubles subsequent spell damage to that unit", () => {
    const game = makeGame();
    const target = putOnBase(game, "unit-doomed-recruit", "1");
    target.damageMultiplier = 2;

    dealSpellDamage(game, getCard, target.instanceId, 3, "0");

    expect(target.damage).toBe(6);
  });

  it("doubles combat damage enough to kill a unit that would otherwise survive", () => {
    const game = makeGame();
    // unit-vanguard-striker has 2 Might/toughness while defending (its Assault bonus is
    // attack-only); a Might-1 attacker alone only deals 1 (survives).
    const defender = putOnBattlefield(game, "unit-vanguard-striker", "0", 0);
    defender.damageMultiplier = 2;
    const attacker = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    attacker.exhausted = true;

    resolveCombat(game, getCard, 0, "1");

    expect(game.instances[defender.instanceId]).toBeUndefined();
  });
});
