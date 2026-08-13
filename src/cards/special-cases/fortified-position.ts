import type { SpecialCaseHandler } from "./types";

/**
 * When you defend here, choose a unit. It gains [Shield 2] this combat. (+2 Might while it's a
 * defender.)
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — grants it to the
 * first defending unit. Granted via `grantedThisTurn` (cleared at the defender's next Awaken),
 * slightly more generous than "this combat" if another Showdown happens here the same turn.
 */
export const fortifiedPosition: SpecialCaseHandler = {
  cardId: "fortified-position",
  onDefendHere: (ctx, defenderIds) => {
    const targetId = defenderIds[0];
    if (!targetId) return;
    const target = ctx.game.instances[targetId];
    if (!target) return;
    target.grantedThisTurn.push({ keyword: "shield", value: 2 });
  },
};
