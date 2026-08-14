import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * [Hidden] [Backline] Once each turn, when an enemy unit dies while I'm at a battlefield, play a
 * Gold gear token exhausted.
 *
 * Only the token-on-kill ability is implemented — the Hidden alternate play mode (playing this
 * face down) isn't modeled (see docs/data-sourcing.md); Pyke still enters play normally.
 * Approximates "an enemy unit dies" as "this player kills an enemy unit" via onAllyKillUnit,
 * which covers combat and spell kills — the two sources that matter in practice.
 */
export const pykeReturned: SpecialCaseHandler = {
  cardId: "pyke-returned",
  onAllyKillUnit: (ctx) => {
    if (ctx.instance.statuses.playedTokenThisTurn) return;
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    ctx.instance.statuses.playedTokenThisTurn = true;
    const token = playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
    token.exhausted = true;
  },
};
