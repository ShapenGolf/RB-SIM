import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const XP_COST = 3;

/**
 * [Hunt] (generic keyword, already wired — grants player-level XP on conquer/hold.)
 * When I attack, you may spend 3 XP to deal damage equal to my Might to an enemy unit here.
 *
 * Simplification: the "may" always resolves yes when the controller can afford it and a legal
 * target exists (no real downside — see docs/data-sourcing.md). No player choice of which enemy
 * unit — picks the strongest one at the same battlefield.
 */
export const khaZixEvolvingHunter: SpecialCaseHandler = {
  cardId: "kha-zix-evolving-hunter",
  onAttack: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.xp < XP_COST) return;
    if (ctx.instance.battlefieldIndex === null) return;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    let strongest: CardInstance | undefined;
    for (const id of slot.units[enemyId]) {
      const instance = ctx.game.instances[id];
      if (!instance) continue;
      if (!strongest || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, strongest, "none")) {
        strongest = instance;
      }
    }
    if (!strongest) return;
    player.xp -= XP_COST;
    const might = computeMight(ctx.game, getCard, ctx.instance, "none");
    dealSpellDamage(ctx.game, getCard, strongest.instanceId, might, ctx.instance.controller);
  },
};
