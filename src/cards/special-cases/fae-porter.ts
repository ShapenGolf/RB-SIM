import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { SpecialCaseEngine } from "./registry";
import { moveInstanceToBattlefield } from "./move-helpers";
import { computeMight } from "../../game/might";

/**
 * When I move to a battlefield, you may pay Chaos Rune to move a unit you control to the same
 * battlefield. Simplification: only considers units in base (not relocating from another
 * battlefield) and auto-picks the controller's strongest ready one — no player choice of which
 * unit (see docs/data-sourcing.md).
 */
export const faePorter: SpecialCaseHandler = {
  cardId: "fae-porter",
  onMove: (ctx) => {
    if (ctx.game.pendingOptionalCost) return;
    if (ctx.instance.battlefieldIndex === null) return;
    const hasCandidate = ctx.game.players[ctx.instance.controller].base.some((id) => {
      const inst = ctx.game.instances[id];
      if (inst.exhausted) return false;
      const card = getCard(inst.cardId);
      return card.type === "unit" || card.type === "champion";
    });
    if (!hasCandidate) return;
    SpecialCaseEngine.offerOptionalCost(
      ctx.game,
      ctx.instance.controller,
      "fae-porter",
      { energy: 0, runeDomain: "Chaos" },
      String(ctx.instance.battlefieldIndex),
    );
  },
  onOptionalCostPaid: (game, playerId, payload) => {
    if (payload === undefined) return;
    const battlefieldIndex = Number(payload);
    let best: string | undefined;
    let bestMight = -Infinity;
    for (const id of game.players[playerId].base) {
      const inst = game.instances[id];
      if (inst.exhausted) continue;
      const card = getCard(inst.cardId);
      if (card.type !== "unit" && card.type !== "champion") continue;
      const might = computeMight(game, getCard, inst, "none");
      if (might > bestMight) {
        bestMight = might;
        best = id;
      }
    }
    if (best) moveInstanceToBattlefield(game, best, battlefieldIndex);
  },
};
