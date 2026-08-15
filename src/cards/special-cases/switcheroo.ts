import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] [Action] Swap the Might of two units at the same battlefield this turn.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: no player choice of which
 * battlefield/units — picks the battlefield with the most total units, swaps its two strongest.
 */
export const switcheroo: SpecialCaseHandler = {
  cardId: "switcheroo",
  onPlay: (ctx) => {
    let bestIndex = -1;
    let bestCount = -1;
    ctx.game.battlefields.forEach((slot, index) => {
      const count = slot.units["0"].length + slot.units["1"].length;
      if (count > bestCount) {
        bestCount = count;
        bestIndex = index;
      }
    });
    if (bestIndex === -1 || bestCount < 2) return;
    const slot = ctx.game.battlefields[bestIndex];
    const all = [...slot.units["0"], ...slot.units["1"]]
      .map((id) => ctx.game.instances[id])
      .filter((i): i is CardInstance => Boolean(i));
    if (all.length < 2) return;
    const sorted = all.sort(
      (a, b) => computeMight(ctx.game, getCard, b, "none") - computeMight(ctx.game, getCard, a, "none"),
    );
    const [a, b] = sorted;
    const mightA = computeMight(ctx.game, getCard, a, "none");
    const mightB = computeMight(ctx.game, getCard, b, "none");
    a.tempMightBonus += mightB - mightA;
    b.tempMightBonus += mightA - mightB;
  },
};
