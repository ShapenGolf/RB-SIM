import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * When you play a token unit, give me +1 Might this turn.
 * Your token units have [Tank].
 *
 * Only the first clause is implemented — granting Tank to every token unit the controller owns,
 * persistently while Lillia is in play, would need a new "aura grants keyword to a tag-class"
 * hook this engine doesn't have yet (see docs/data-sourcing.md).
 */
export const lilliaProtectorOfDreams: SpecialCaseHandler = {
  cardId: "lillia-protector-of-dreams",
  onAllyTokenPlayed: (ctx, tokenCard) => {
    if (tokenCard.type !== "unit" && tokenCard.type !== "champion") return;
    ctx.instance.tempMightBonus += MIGHT_BONUS;
  },
};
