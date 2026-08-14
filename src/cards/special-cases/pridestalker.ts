import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const MIGHT_BONUS = 1;

/**
 * When you play a unit, give a unit +1 Might this turn.
 *
 * Simplification: no player choice of which unit receives the bonus (see
 * docs/data-sourcing.md) — picks the first friendly unit/champion found.
 */
export const pridestalker: SpecialCaseHandler = {
  cardId: "pridestalker",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (target) target.tempMightBonus += MIGHT_BONUS;
  },
};
