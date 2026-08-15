import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * [Empower] — Exhaust (Pay the cost: Empower this. Use only if not Empowered.)
 * Disempower this, 1 Energy, Exhaust: Play a 3 Might Mech unit token to your base.
 *
 * Simplification: "must currently be Empowered" is checked as a soft gate inside onActivate
 * rather than a dedicated ActivatedAbilityCost precondition type (no generic infra for that —
 * see docs/data-sourcing.md); the ability still costs 1 Energy + Exhaust either way.
 */
export const hextechDisc: SpecialCaseHandler = {
  cardId: "hextech-disc",
  empowerCost: { energy: 0, exhaustSelf: true },
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  onActivate: (ctx) => {
    if (!ctx.instance.statuses.empowered) return;
    ctx.instance.statuses.empowered = false;
    playTokenToBase(ctx.game, "token-mech-3", ctx.instance.controller);
  },
};
