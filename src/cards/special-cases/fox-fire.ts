import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { SpecialCaseHandler } from "./types";

const MIGHT_CAP = 4;

/**
 * [Hidden] [Action] Kill any number of units at a battlefield with total Might 4 or less.
 *
 * [Hidden]'s face-down timing isn't modeled — resolves immediately. Simplification: no player
 * choice of which battlefield (see docs/data-sourcing.md) — picks the battlefield where killing
 * the most (weakest-first) units stays within the 4 Might budget.
 */
export const foxFire: SpecialCaseHandler = {
  cardId: "fox-fire",
  onPlay: (ctx) => {
    let bestIndex = -1;
    let bestKillList: string[] = [];
    ctx.game.battlefields.forEach((slot, index) => {
      const units = [...slot.units["0"], ...slot.units["1"]]
        .map((id) => ctx.game.instances[id])
        .filter((i): i is NonNullable<typeof i> => Boolean(i))
        .sort((a, b) => computeMight(ctx.game, getCard, a, "none") - computeMight(ctx.game, getCard, b, "none"));
      const killList: string[] = [];
      let total = 0;
      for (const unit of units) {
        const might = computeMight(ctx.game, getCard, unit, "none");
        if (total + might > MIGHT_CAP) continue;
        total += might;
        killList.push(unit.instanceId);
      }
      if (killList.length > bestKillList.length) {
        bestKillList = killList;
        bestIndex = index;
      }
    });
    if (bestIndex === -1) return;
    for (const instanceId of bestKillList) {
      destroyInstance(ctx.game, getCard, instanceId);
    }
  },
};
