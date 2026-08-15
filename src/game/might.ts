import type { Card } from "../cards/types";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import type { CardInstance, GameState } from "./state";

export type CombatRole = "attacking" | "defending" | "none";

/** Combines base Might, temporary buffs, keyword modifiers, and special-case static/ally bonuses. */
export function computeMight(
  game: GameState,
  getCard: (cardId: string) => Card,
  instance: CardInstance,
  role: CombatRole,
): number {
  const card = getCard(instance.cardId);
  // "Buff" is Riftbound's own term for a single, non-stacking permanent +1 Might counter
  // (a unit either has one or doesn't — "if it doesn't have a buff, it gets a +1 Might buff").
  const buffBonus = instance.statuses.buffed ? 1 : 0;
  // Sum of attached Equipment's own `might` field, which (per current import data) is null/0
  // for every Equipment card we have — see cards/db.ts and docs/data-sourcing.md. Wired here so
  // any future data fix (or a hand-written Equipment special case using staticMightModifier)
  // is picked up automatically without touching this function again.
  const equipmentBonus = instance.equipment.reduce((sum, gearId) => {
    const gear = game.instances[gearId];
    return sum + (gear ? getCard(gear.cardId).might ?? 0 : 0);
  }, 0);
  let total = (card.might ?? 0) + instance.tempMightBonus + buffBonus + equipmentBonus;

  total += SpecialCaseEngine.staticMightModifier(game, card, instance);
  total += SpecialCaseEngine.staticMightModifierFromEnemies(game, getCard, instance);
  total += SpecialCaseEngine.staticMightModifierFromAllies(game, getCard, instance);
  total += SpecialCaseEngine.staticMightModifierFromBattlefield(game, getCard, instance);

  if (role === "attacking") {
    total += KeywordEngine.attackingMightModifier(game, card, instance);
    total += SpecialCaseEngine.attackingMightModifier(game, card, instance);
    total += SpecialCaseEngine.attackingMightBonusFromAllies(game, getCard, instance);
  } else if (role === "defending") {
    total += KeywordEngine.defendingMightModifier(game, card, instance);
    total += SpecialCaseEngine.defendingMightModifier(game, card, instance);
    total += SpecialCaseEngine.defendingMightBonusFromAllies(game, getCard, instance);
    total += SpecialCaseEngine.defendingMightModifierFromBattlefield(game, getCard, instance);
  }

  return Math.max(0, total);
}
