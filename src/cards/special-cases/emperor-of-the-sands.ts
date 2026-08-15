import { playTokenToBase } from "./token-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * Your Sand Soldiers have [Weaponmaster].
 * 1 Energy, Exhaust: Play a 2 Might Sand Soldier unit token to your base. Use only if you've
 * played an Equipment this turn.
 *
 * Known gap: the "Your Sand Soldiers have Weaponmaster" static grant isn't modeled (no hook for
 * tag-scoped keyword grants — see docs/data-sourcing.md), and the "played an Equipment this
 * turn" activation condition isn't tracked, so the ability is always available. Enters
 * exhausted, matching the token's own printed text (no [Accelerate]/enters-ready grant here).
 */
export const emperorOfTheSands: SpecialCaseHandler = {
  cardId: "emperor-of-the-sands",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  onActivate: (ctx) => {
    playTokenToBase(ctx.game, "token-sand-soldier-2", ctx.instance.controller);
  },
};
