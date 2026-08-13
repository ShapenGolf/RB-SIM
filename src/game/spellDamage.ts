import type { Card } from "../cards/types";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { destroyInstance } from "./combat";
import { computeMight } from "./might";
import type { GameState, PlayerId } from "./state";

/**
 * Deals `amount` spell damage to `targetInstanceId`, destroying it if lethal and firing the
 * onAllyKillWithSpell trash broadcast (see cards/special-cases/registry.ts) if it dies — the one
 * place spell damage should be applied from, so cards reacting to "when you kill a unit with a
 * spell" (e.g. Immortal Phoenix) see every kill regardless of which spell caused it.
 */
export function dealSpellDamage(
  game: GameState,
  getCard: (id: string) => Card,
  targetInstanceId: string,
  amount: number,
  controller: PlayerId,
): void {
  const target = game.instances[targetInstanceId];
  if (!target) return;
  target.damage += amount + game.players[controller].nextSpellBonusDamage;
  const toughness = computeMight(game, getCard, target, "none");
  if (target.damage >= toughness) {
    destroyInstance(game, getCard, targetInstanceId);
    SpecialCaseEngine.onAllyKillWithSpell(game, getCard, controller, target);
  }
}
