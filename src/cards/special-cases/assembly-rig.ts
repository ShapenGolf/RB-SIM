import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * 1 Energy+Fury Rune, Recycle a unit from your trash, Exhaust: Play a 3 Might Mech unit token
 * to your base.
 *
 * Simplification: recycleFromTrash takes the front card of trash regardless of type (see
 * docs/data-sourcing.md) — not specifically a unit.
 */
export const assemblyRig: SpecialCaseHandler = {
  cardId: "assembly-rig",
  activatedAbilityCost: { energy: 1, runeDomain: "Fury", exhaustSelf: true, recycleFromTrash: 1 },
  onActivate: (ctx) => {
    playTokenToBase(ctx.game, "token-mech-3", ctx.instance.controller);
  },
};
