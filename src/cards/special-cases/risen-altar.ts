import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] costs of your units here cost 1 Energy or Rune less.
 *
 * Moot — game/moves.ts empowerInstance's cost validation has no reduction-hook chain (unlike the
 * play-cost formula's costReduction/costReductionFromAllies/costReductionFromControlledBattlefields
 * built this session) — extending it is out of scope right now (deferred, see
 * docs/data-sourcing.md). No fallback mode.
 */
export const risenAltar: SpecialCaseHandler = {
  cardId: "risen-altar",
};
