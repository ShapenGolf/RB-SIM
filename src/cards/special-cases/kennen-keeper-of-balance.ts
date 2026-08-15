import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { SpecialCaseEngine } from "./registry";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;

/**
 * [Hidden] When you play me or I attack, you may pay 2 Energy to [Stun] a unit. While there's a
 * stunned enemy unit here, I have +2 Might.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: no player choice of which unit to
 * Stun (see docs/data-sourcing.md) — targets the strongest enemy unit at Kennen's battlefield.
 */
function offerStun(ctx: SpecialCaseContext): void {
  if (ctx.game.pendingOptionalCost) return;
  if (ctx.instance.battlefieldIndex === null) return;
  SpecialCaseEngine.offerOptionalCost(
    ctx.game,
    ctx.instance.controller,
    "kennen-keeper-of-balance",
    { energy: 2 },
    String(ctx.instance.battlefieldIndex),
  );
}

export const kennenKeeperOfBalance: SpecialCaseHandler = {
  cardId: "kennen-keeper-of-balance",
  onPlay: (ctx) => offerStun(ctx),
  onAttack: (ctx) => offerStun(ctx),
  onOptionalCostPaid: (game, playerId, payload) => {
    if (!payload) return;
    const battlefieldIndex = Number(payload);
    const slot = game.battlefields[battlefieldIndex];
    if (!slot) return;
    const enemyId = playerId === "0" ? "1" : "0";
    let strongest: CardInstance | undefined;
    for (const id of slot.units[enemyId]) {
      const instance = game.instances[id];
      if (!instance) continue;
      if (!strongest || computeMight(game, getCard, instance, "none") > computeMight(game, getCard, strongest, "none")) {
        strongest = instance;
      }
    }
    if (strongest) strongest.statuses.stunned = true;
  },
  staticMightModifier: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return 0;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const hasStunnedEnemy = slot.units[enemyId].some((id) => ctx.game.instances[id]?.statuses.stunned);
    return hasStunnedEnemy ? MIGHT_BONUS : 0;
  },
};
