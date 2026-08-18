import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Choose a friendly unit and a spell. Counter that spell and give that unit +Might equal to that
 * spell's Energy cost this turn.
 *
 * "...a spell" is implicitly the currently-pending one — this engine only ever has one spell
 * paused for a reaction window at a time (see PendingSpellReaction).
 */
export const riposte: SpecialCaseHandler = {
  cardId: "riposte",
  needsPlayTarget: true,
  canCounterPending: (ctx, _pending, targetInstanceId) => {
    if (!targetInstanceId) return false;
    const chosen = ctx.game.instances[targetInstanceId];
    if (!chosen || chosen.controller !== ctx.instance.controller) return false;
    const chosenCard = getCard(chosen.cardId);
    return chosenCard.type === "unit" || chosenCard.type === "champion";
  },
  onPlay: (ctx, targetInstanceId) => {
    const pending = ctx.game.pendingSpellReaction;
    const target = targetInstanceId ? ctx.game.instances[targetInstanceId] : undefined;
    if (!pending || !target) return;
    const energyCost = getCard(pending.cardId).energyCost;
    if (energyCost) target.tempMightBonus += energyCost;
  },
};
