import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * [Weaponmaster] When I conquer an open battlefield, deal damage equal to my Might to an enemy
 * unit in a base.
 *
 * Simplification: "open" (no units of either side were there before the Showdown) is
 * approximated as `excessDamage === 0` (see game/combat.ts `assignDamage` — 0 excess damage is
 * also what a Battlefield with no defenders present produces), since onConquer doesn't carry
 * more precise information. No player choice of which enemy base unit (see
 * docs/data-sourcing.md) — hits the first one found.
 */
export const yoneBlademaster: SpecialCaseHandler = {
  cardId: "yone-blademaster",
  onConquer: (ctx, excessDamage) => {
    if (excessDamage !== 0) return;
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const targetId = ctx.game.players[opponentId].base.find((id) => {
      const type = getCard(ctx.game.instances[id]?.cardId ?? "").type;
      return type === "unit" || type === "champion";
    });
    if (!targetId) return;
    const might = computeMight(ctx.game, getCard, ctx.instance, "none");
    dealSpellDamage(ctx.game, getCard, targetId, might, ctx.instance.controller);
  },
};
