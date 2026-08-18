import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter an enemy spell or ability that chooses a friendly unit or gear.
 *
 * "Enemy" is automatically satisfied — only the pending spell's non-caster can ever legally react
 * to it at all (see moves.ts's playCard). "...or ability" isn't covered: activated abilities never
 * open a reaction window in this engine (only spells do — see PendingSpellReaction), so this only
 * matches the spell half of the text.
 */
export const notSoFast: SpecialCaseHandler = {
  cardId: "not-so-fast",
  canCounterPending: (ctx, pending) => {
    if (!pending.targetInstanceId) return false;
    const target = ctx.game.instances[pending.targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return false;
    const targetCard = getCard(target.cardId);
    return targetCard.type === "unit" || targetCard.type === "champion" || targetCard.type === "gear";
  },
};
