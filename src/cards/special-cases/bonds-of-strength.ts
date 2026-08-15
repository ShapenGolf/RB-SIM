import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * [Reaction] [Repeat] 2 Energy (You may pay the additional cost to repeat this spell's effect.)
 * Give two friendly units each +1 Might this turn.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md)
 * — only the base single resolution is implemented. Reaction timing isn't modeled — resolves
 * immediately. Simplification: no player choice of which units (see docs/data-sourcing.md) —
 * picks the first two friendly units found.
 */
export const bondsOfStrength: SpecialCaseHandler = {
  cardId: "bonds-of-strength",
  onPlay: (ctx) => {
    const targets = Object.values(ctx.game.instances)
      .filter((i) => {
        if (i.controller !== ctx.instance.controller) return false;
        const t = getCard(i.cardId).type;
        return t === "unit" || t === "champion";
      })
      .slice(0, 2);
    for (const target of targets) target.tempMightBonus += MIGHT_BONUS;
  },
};
