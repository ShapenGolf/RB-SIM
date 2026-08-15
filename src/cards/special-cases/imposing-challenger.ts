import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { moveInstanceToBattlefield } from "./move-helpers";

/**
 * When I move, you may move an enemy unit here with less Might than me to a different
 * battlefield. Always taken when a legal target exists (no attached cost, strictly beneficial —
 * see docs/data-sourcing.md). With exactly 2 Battlefields in play, "a different battlefield" is
 * unambiguous.
 */
export const imposingChallenger: SpecialCaseHandler = {
  cardId: "imposing-challenger",
  onMove: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const myMight = computeMight(ctx.game, getCard, ctx.instance, "none");
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const targetId = slot.units[opponentId].find(
      (id) => computeMight(ctx.game, getCard, ctx.game.instances[id], "none") < myMight,
    );
    if (!targetId) return;
    const otherIndex = ctx.game.battlefields.findIndex((_slot, i) => i !== ctx.instance.battlefieldIndex);
    if (otherIndex === -1) return;
    moveInstanceToBattlefield(ctx.game, targetId, otherIndex);
  },
};
