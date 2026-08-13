import type { SpecialCaseHandler } from "./types";

/**
 * If you've discarded a card this turn, I have Assault and Ganking.
 *
 * Data quirk (see docs/data-sourcing.md "Bekannte Einschränkungen"): the
 * import can't tell a conditionally-granted keyword mention from a printed
 * one, so this card's `keywords` array already carries an *unconditional*
 * Assault 1 (Ganking has no handler at all yet, so it's a no-op either way).
 * Rather than leave the printed Assault always-on, this cancels it out
 * exactly when the condition is false, so the net effect matches the real
 * conditional text without touching the shared import pipeline for one card.
 */
export const ragingSoul: SpecialCaseHandler = {
  cardId: "raging-soul",
  attackingMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].discardedCardThisTurn ? 0 : -1,
};
