import type { SpecialCaseHandler } from "./types";

/**
 * Give a unit [Assault 4] this turn. (+4 Might while it's an attacker.)
 * Repeat (discard 1 to play this again from trash) isn't wired up yet — see
 * docs/data-sourcing.md; this covers the card's baseline single effect.
 */
export const squareUp: SpecialCaseHandler = {
  cardId: "square-up",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.grantedThisTurn.push({ keyword: "assault", value: 4 });
  },
};
