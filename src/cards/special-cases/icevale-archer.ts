import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { SpecialCaseEngine } from "./registry";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHT_PENALTY = 1;

/**
 * When I attack, you may pay 1 Energy to give a unit here -1 Might this turn.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — targets the
 * strongest enemy unit at the same battlefield, since debuffing is strictly offensive here.
 */
export const icevaleArcher: SpecialCaseHandler = {
  cardId: "icevale-archer",
  onAttack: (ctx) => {
    if (ctx.game.pendingOptionalCost) return;
    if (ctx.instance.battlefieldIndex === null) return;
    SpecialCaseEngine.offerOptionalCost(
      ctx.game,
      ctx.instance.controller,
      "icevale-archer",
      { energy: 1 },
      String(ctx.instance.battlefieldIndex),
    );
  },
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
    if (strongest) strongest.tempMightBonus -= MIGHT_PENALTY;
  },
};
