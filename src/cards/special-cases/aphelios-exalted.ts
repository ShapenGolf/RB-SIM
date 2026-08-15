import type { SpecialCaseHandler } from "./types";

const READY_AMOUNT = 2;

/**
 * When you attach an Equipment to me, choose one that hasn't been chosen this turn — Ready 2
 * runes. / Channel 1 rune exhausted. / Buff a friendly unit.
 *
 * Simplification: no player choice of mode, and the "hasn't been chosen this turn" rotation
 * isn't tracked (see docs/data-sourcing.md) — always readies 2 exhausted runes, the mode with
 * the widest applicability regardless of board state.
 */
export const apheliosExalted: SpecialCaseHandler = {
  cardId: "aphelios-exalted",
  onEquip: (ctx) => {
    const toReady = ctx.game.players[ctx.instance.controller].runePool
      .filter((r) => r.exhausted)
      .slice(0, READY_AMOUNT);
    for (const rune of toReady) rune.exhausted = false;
  },
};
