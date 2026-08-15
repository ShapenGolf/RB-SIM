import { getCard } from "../db";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

function isUnitOrChampion(cardId: string): boolean {
  const t = getCard(cardId).type;
  return t === "unit" || t === "champion";
}

/**
 * You may exhaust your legend as an additional cost to play me. When you play me, if you paid
 * the additional cost, move any number of your units to an open battlefield.
 *
 * Simplification: legend-exhaust isn't a generic additional-cost type (only Domain-Rune/Energy
 * are) — approximated the same way Domain-Rune costs are: the "may" is trusted via the existing
 * paidAdditionalCostThisTurn flag, with the legend exhausted as a side effect if it was ready.
 * "Any number" of units auto-resolves to all eligible units (no real downside — see
 * docs/data-sourcing.md). No player choice of which open battlefield — picks the first one found.
 */
export const bardMercurial: SpecialCaseHandler = {
  cardId: "bard-mercurial",
  additionalPlayCostEnergy: () => 0,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (legend && !legend.exhausted) legend.exhausted = true;

    const openIndex = ctx.game.battlefields.findIndex(
      (slot) => slot.units["0"].length === 0 && slot.units["1"].length === 0,
    );
    if (openIndex === -1) return;
    const myUnits = Object.values(ctx.game.instances).filter(
      (i) =>
        i.controller === ctx.instance.controller &&
        isUnitOrChampion(i.cardId) &&
        !(i.zone === "battlefield" && i.battlefieldIndex === openIndex),
    );
    for (const unit of myUnits) moveInstanceToBattlefield(ctx.game, unit.instanceId, openIndex);
  },
};
