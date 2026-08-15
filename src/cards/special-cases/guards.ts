import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * [Hidden] Play a 2 Might Sand Soldier unit token. You may pay Order Rune to ready it.
 *
 * [Hidden]'s face-down timing isn't modeled — resolves immediately. Simplification: the
 * Domain-Rune-only additional cost is never charged (established precedent, see
 * crescent-guardian.ts) — the token always enters ready.
 */
export const guards: SpecialCaseHandler = {
  cardId: "guards",
  onPlay: (ctx) => {
    const token = playTokenToBase(ctx.game, "token-sand-soldier-2", ctx.instance.controller);
    token.exhausted = false;
  },
};
