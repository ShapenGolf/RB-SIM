import type { SpecialCaseHandler } from "./types";

/**
 * When a buffed unit you control would die, you may pay Rune and exhaust me to spend its buff
 * and recall it exhausted instead. (Send it to base. This isn't a move.)
 * When you conquer, ready me.
 *
 * Known gap: the death-prevention/recall clause isn't modeled (no "would die" interception
 * point wired for Legends yet — see docs/data-sourcing.md). Only the "when you conquer, ready
 * me" clause is implemented.
 */
export const theBoss: SpecialCaseHandler = {
  cardId: "the-boss",
  onConquer: (ctx) => {
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (legend) legend.exhausted = false;
  },
};
