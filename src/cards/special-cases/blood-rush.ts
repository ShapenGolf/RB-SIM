import type { SpecialCaseHandler } from "./types";

/**
 * Give a unit [Assault 2]. (+2 Might while it's an attacker.)
 * Repeat (pay 1 Energy to play this again from trash) isn't wired up yet — see
 * docs/data-sourcing.md; this covers the card's baseline single effect.
 */
export const bloodRush: SpecialCaseHandler = {
  cardId: "blood-rush",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.grantedThisTurn.push({ keyword: "assault", value: 2 });
  },
};
