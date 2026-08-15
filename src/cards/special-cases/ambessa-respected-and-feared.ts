import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

/**
 * [Empower] 1 Energy+Order Rune (1 Energy+Order Rune: Empower me. Use only if not Empowered.)
 * [Empowered] I have [Assault 2].
 * [Empowered] When I attack, kill an enemy unit here with less Might than me.
 * Assault 2 stays cancelled while not Empowered — same importer-bug workaround as the other
 * conditional-Assault cases in earlier batches (no override hook exists for Assault the way
 * hasConditionalGanking does for Ganking).
 */
export const ambessaRespectedAndFeared: SpecialCaseHandler = {
  cardId: "ambessa-respected-and-feared",
  empowerCost: { energy: 1, runeDomain: "Order" },
  attackingMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 0 : -2),
  onAttack: (ctx) => {
    if (!ctx.instance.statuses.empowered) return;
    if (ctx.instance.battlefieldIndex === null) return;
    const myMight = computeMight(ctx.game, getCard, ctx.instance, "attacking");
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const targetId = slot.units[opponentId].find(
      (id) => computeMight(ctx.game, getCard, ctx.game.instances[id], "none") < myMight,
    );
    if (targetId) destroyInstance(ctx.game, getCard, targetId);
  },
};
