import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 2;

/**
 * Deal 2 to a unit. Its controller may play this spell again for Rune. If they do, this deals 1
 * additional Bonus Damage for each time this spell has dealt damage this turn.
 *
 * Known gap: only the base "Deal 2 to a unit" is implemented. "May play this spell again for
 * Rune" (a self-recast chain with a growing damage counter) isn't modeled — this engine has no
 * "replay the same spell instance" mechanic (deferred, see docs/data-sourcing.md).
 */
export const dancingGrenade: SpecialCaseHandler = {
  cardId: "dancing-grenade",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    if (!ctx.game.instances[targetInstanceId]) return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, DAMAGE, ctx.instance.controller);
  },
};
