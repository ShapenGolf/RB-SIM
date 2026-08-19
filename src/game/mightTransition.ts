import type { Card } from "../cards/types";
import type { GameState } from "./state";
import { computeMight } from "./might";
import { SpecialCaseEngine } from "../cards/special-cases/registry";

const MIGHTY_THRESHOLD = 5;

/**
 * Checkpoint-based "becomes Mighty" (5+ Might, e.g. Fiora, Worthy / Grand Duelist) detection.
 * Might is computed dynamically (game/might.ts computeMight) from printed Might plus static
 * auras, temporary bonuses, keyword grants, and Equipment — there's no single mutation
 * chokepoint to hook, so this instead re-scans every unit/champion in play and compares against
 * each instance's own last-known Mighty state (CardInstance.statuses.wasMighty — deliberately NOT
 * a "ThisTurn"-suffixed key, since this must persist across turns, not auto-reset at Awaken).
 *
 * Called after each major action resolves (see call sites: game/moves.ts resolvePlayedCard/
 * activateAbility/attackBattlefield, game/combat.ts finishCombatResolution, game/equip.ts
 * attachEquipment/detachEquipment, game/turnFlow.ts runAwaken) rather than after every possible
 * Might-affecting mutation (there are dozens, scattered across templated effects and special-case
 * handlers, with no shared chokepoint of their own).
 *
 * Documented simplification: a transition caused PURELY by a static aura shifting — e.g. an
 * untouched unit's effective Might changing because a DIFFERENT unit's aura came into or left
 * scope, with neither instance being the direct subject of the triggering action — can be missed
 * if it doesn't fall within one of those checkpoints' scan window. In practice the overwhelming
 * majority of real Might changes (temp-bonus grants, buffs, Equipment, keyword grants) ARE tied to
 * a specific resolving action and so are caught.
 */
export function checkBecameMighty(game: GameState, getCard: (id: string) => Card): void {
  for (const instance of Object.values(game.instances)) {
    if (instance.zone !== "battlefield" && instance.zone !== "base") continue;
    const card = getCard(instance.cardId);
    if (card.type !== "unit" && card.type !== "champion") continue;
    const isMighty = computeMight(game, getCard, instance, "none") >= MIGHTY_THRESHOLD;
    const wasMighty = Boolean(instance.statuses.wasMighty);
    instance.statuses.wasMighty = isMighty;
    if (isMighty && !wasMighty) {
      SpecialCaseEngine.onAllyBecameMighty(game, getCard, instance.controller, instance);
    }
  }
}
