import type { SpecialCaseHandler } from "./types";

/**
 * When you recycle a rune, you may exhaust me to play a Gold gear token exhausted.
 * When one or more enemy units die, ready me.
 *
 * Known gap: the "recycle a rune" trigger isn't modeled — this engine has no single chokepoint
 * for "a rune is recycled" (returned from pool to rune deck happens at ~dozens of scattered call
 * sites across cost payments, Awaken, and bespoke effects), unlike the death/move/card-played
 * chokepoints this session was able to extend. The ready-on-enemy-death half uses the new
 * onEnemyUnitDied broadcast (now also reaching each side's Legend — see registry.ts) — writes to
 * the real PlayerState.legend.exhausted directly (chem-baroness.ts precedent), since the pseudo-
 * instance ctx.instance never persists between calls.
 */
export const battleMistress: SpecialCaseHandler = {
  cardId: "battle-mistress",
  onEnemyUnitDied: (ctx) => {
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (legend) legend.exhausted = false;
  },
};
