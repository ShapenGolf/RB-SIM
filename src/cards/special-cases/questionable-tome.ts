import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] — Exhaust (Pay the cost: Empower me. Use only if not Empowered.)
 * Disempower this, 1 Energy, Exhaust: Draw 1.
 *
 * Simplification: "must currently be Empowered" is checked as a soft gate inside onActivate
 * rather than a dedicated ActivatedAbilityCost precondition type (no generic infra for that —
 * see hextech-disc.ts for the same pattern).
 */
export const questionableTome: SpecialCaseHandler = {
  cardId: "questionable-tome",
  empowerCost: { energy: 0, exhaustSelf: true },
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  onActivate: (ctx) => {
    if (!ctx.instance.statuses.empowered) return;
    ctx.instance.statuses.empowered = false;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
