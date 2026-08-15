import type { SpecialCaseHandler } from "./types";

/**
 * 1 EnergyMind Rune: Draw 1.
 * 4 EnergyMind RuneMind RuneMind RuneMind Rune, Exhaust: Score 1 point.
 * Use my abilities only while I'm at a battlefield.
 *
 * Known gap: only the repeatable "1 EnergyMind Rune: Draw 1" ability is modeled — a card can
 * only carry one activatedAbilityCost/onActivate pair, so the second "4 Energy+4 Mind Rune,
 * Exhaust: Score 1 point" ability isn't reachable (see docs/data-sourcing.md). The "only while
 * I'm at a battlefield" restriction also isn't enforced (this hook can't conditionally disable
 * the ability, only price it).
 */
export const renataGlascMastermind: SpecialCaseHandler = {
  cardId: "renata-glasc-mastermind",
  activatedAbilityCost: { energy: 1, runeDomain: "Mind", exhaustSelf: false },
  onActivate: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
