import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BUDGET = 8;

/**
 * Move any number of enemy units with the same controller and a total Might of 8 or less to a
 * single location.
 *
 * Simplification: no player choice of which units/destination (see docs/data-sourcing.md) —
 * greedily gathers the most (weakest-first) enemy units within the Might budget and moves them
 * to the first battlefield the controller controls, or the first battlefield otherwise.
 */
export const tricksyTentacles: SpecialCaseHandler = {
  cardId: "tricksy-tentacles",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const enemyId = controller === "0" ? "1" : "0";
    const units = Object.values(ctx.game.instances)
      .filter((i) => {
        if (i.controller !== enemyId) return false;
        const t = getCard(i.cardId).type;
        return t === "unit" || t === "champion";
      })
      .sort((a, b) => computeMight(ctx.game, getCard, a, "none") - computeMight(ctx.game, getCard, b, "none"));

    const toMove: string[] = [];
    let total = 0;
    for (const unit of units) {
      const might = computeMight(ctx.game, getCard, unit, "none");
      if (total + might > MIGHT_BUDGET) continue;
      total += might;
      toMove.push(unit.instanceId);
    }
    if (toMove.length === 0) return;

    const destIndex = ctx.game.battlefields.findIndex((slot) => slot.controller === controller);
    const index = destIndex !== -1 ? destIndex : 0;
    for (const id of toMove) moveInstanceToBattlefield(ctx.game, id, index);
  },
};
