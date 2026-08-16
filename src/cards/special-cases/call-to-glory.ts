import { getCard } from "../db";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 3;

/**
 * [Reaction] As you play this, you may spend a buff as an additional cost. If you do, ignore
 * this spell's cost. Give a unit +3 Might this turn.
 *
 * Simplification: the "may" always resolves yes when a buffed friendly unit exists (matching the
 * session's established precedent for costly-but-optional trades — see heedless-resurrection.ts,
 * sacrifice.ts) — `costReduction` fully zeroes the Energy cost, and the buff is spent in onPlay.
 * No player choice of which unit to buff/unbuff — picks the first buffed unit found to unbuff,
 * and gives the Might bonus to the controller's strongest unit.
 */
export const callToGlory: SpecialCaseHandler = {
  cardId: "call-to-glory",
  costReduction: (ctx) => {
    const hasBuffedUnit = Object.values(ctx.game.instances).some((i) => {
      if (i.controller !== ctx.instance.controller || !i.statuses.buffed) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    return hasBuffedUnit ? ctx.card.energyCost ?? 0 : 0;
  },
  onPlay: (ctx) => {
    const buffed = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller || !i.statuses.buffed) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (buffed) buffed.statuses.buffed = false;

    let strongest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!strongest) strongest = instance;
    }
    if (strongest) strongest.tempMightBonus += MIGHT_BONUS;
  },
};
