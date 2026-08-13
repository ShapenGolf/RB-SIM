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
  let total = (card.might ?? 0) + instance.tempMightBonus + buffBonus;

  total += SpecialCaseEngine.staticMightModifier(game, card, instance);

  if (role === "attacking") {
    total += KeywordEngine.attackingMightModifier(game, card, instance);
    total += SpecialCaseEngine.attackingMightBonusFromAllies(game, getCard, instance);
  } else if (role === "defending") {
    total += KeywordEngine.defendingMightModifier(game, card, instance);
  }

  return Math.max(0, total);
}
