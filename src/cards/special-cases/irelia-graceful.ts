import type { SpecialCaseHandler } from "./types";

/**
 * Your spells that choose me cost 1 Energy or Rune less.
 * Known gap: only the Energy alternative is charged — the Domain-Rune alternative isn't
 * modeled (see docs/data-sourcing.md).
 */
export const ireliaGraceful: SpecialCaseHandler = {
  cardId: "irelia-graceful",
  costReductionIfTargetedBySpell: () => 1,
};
