import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Choose a friendly unit at a battlefield. Counter an enemy spell or ability that chooses it and
 * no other friendly unit.
 *
 * "...and no other friendly unit" is automatically satisfied — this engine only ever tracks a
 * single chosen target per spell (see PendingSpellReaction.targetInstanceId), never a multi-target
 * choice. "...or ability" isn't covered — see not-so-fast.ts's identical note.
 */
export const repulse: SpecialCaseHandler = {
  cardId: "repulse",
  needsPlayTarget: true,
  canCounterPending: (ctx, pending, targetInstanceId) => {
    if (!targetInstanceId || pending.targetInstanceId !== targetInstanceId) return false;
    const chosen = ctx.game.instances[targetInstanceId];
    return Boolean(chosen && chosen.controller === ctx.instance.controller && chosen.battlefieldIndex !== null);
  },
};
