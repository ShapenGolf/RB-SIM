import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * Choose a friendly unit in your base. Deal damage equal to its Might to all enemy units at a
 * battlefield, then move your unit there.
 *
 * Simplification: no separate battlefield-choice UI (see docs/data-sourcing.md) — picks the
 * first battlefield with enemy units present.
 */
export const stormbringer: SpecialCaseHandler = {
  cardId: "stormbringer",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller || target.zone !== "base") return;

    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const battlefieldIndex = ctx.game.battlefields.findIndex((b) => b.units[opponentId].length > 0);
    if (battlefieldIndex === -1) return;

    const might = computeMight(ctx.game, getCard, target, "none");
    const slot = ctx.game.battlefields[battlefieldIndex];
    for (const enemyId of [...slot.units[opponentId]]) {
      if (!ctx.game.instances[enemyId]) continue;
      dealSpellDamage(ctx.game, getCard, enemyId, might, ctx.instance.controller);
    }

    const stillThere = ctx.game.instances[targetInstanceId];
    if (!stillThere) return;
    ctx.game.players[target.controller].base = ctx.game.players[target.controller].base.filter(
      (id) => id !== targetInstanceId,
    );
    stillThere.zone = "battlefield";
    stillThere.battlefieldIndex = battlefieldIndex;
    ctx.game.battlefields[battlefieldIndex].units[target.controller].push(targetInstanceId);
  },
};
