import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";
import { playTokenToBase } from "./token-helpers";

const DAMAGE = 3;

/**
 * Deal 3 to an enemy unit. When it dies this turn, play a Gold gear token exhausted.
 *
 * Simplification: only checks whether this damage itself was lethal, not whether the target
 * dies from some other effect later the same turn (no infra for watching a specific instance
 * across the rest of the turn — see docs/data-sourcing.md).
 */
export const deadlyFlourish: SpecialCaseHandler = {
  cardId: "deadly-flourish",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, DAMAGE, ctx.instance.controller);
    if (!ctx.game.instances[targetInstanceId]) {
      const token = playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
      token.exhausted = true;
    }
  },
};
