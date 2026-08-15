import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 1;
const MAX_TARGETS = 3;

/**
 * [Action] [Repeat] 1 Energy Mind Rune (You may pay the additional cost to repeat this spell's
 * effect.) Deal 1 to up to three units at the same location.
 *
 * [Repeat] isn't wired up (~24 occurrences across the card pool, deliberately not built — see
 * docs/data-sourcing.md) — only the base single resolution is implemented. Simplification: no
 * player choice of location (see docs/data-sourcing.md) — picks the battlefield with the most
 * enemy units, hitting up to 3 of them.
 */
export const bellowsBreath: SpecialCaseHandler = {
  cardId: "bellows-breath",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let bestIndex = -1;
    let bestCount = 0;
    ctx.game.battlefields.forEach((slot, index) => {
      const count = slot.units[enemyId].length;
      if (count > bestCount) {
        bestCount = count;
        bestIndex = index;
      }
    });
    if (bestIndex === -1) return;
    const targets = ctx.game.battlefields[bestIndex].units[enemyId].slice(0, MAX_TARGETS);
    for (const targetId of targets) {
      dealSpellDamage(ctx.game, getCard, targetId, DAMAGE, ctx.instance.controller);
    }
  },
};
