import type { SpecialCaseHandler } from "./types";

/**
 * When you hold, gain 1 XP.
 * Spend 3 XP, Exhaust: Draw 1.
 *
 * Known gap: the "Spend 3 XP, Exhaust: Draw 1" activated ability isn't modeled — Legend
 * activated abilities can't spend the player-level XP pool in this engine (activateLegendAbility
 * explicitly rejects spendXP costs, since that cost type is defined against a CardInstance's own
 * xp counter, which a Legend pseudo-instance doesn't persist — see docs/data-sourcing.md). Only
 * the passive "when you hold, gain 1 XP" is implemented.
 */
export const keeperOfTheHammer: SpecialCaseHandler = {
  cardId: "keeper-of-the-hammer",
  onHold: (ctx) => {
    ctx.game.players[ctx.instance.controller].xp += 1;
  },
};
