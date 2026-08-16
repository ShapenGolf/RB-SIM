import type { SpecialCaseHandler } from "./types";

/**
 * Each player chooses 2 units, 2 gear, 2 runes, and 2 cards in their hands. Recycle the rest.
 *
 * Moot — a full-board, multi-category "choose what to keep" decision for BOTH players has no
 * reasonable deterministic auto-pick (unlike single-value optimizations like "weakest unit") and
 * no player-choice UI to ask (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const divineJudgment: SpecialCaseHandler = {
  cardId: "divine-judgment",
};
