import type { SpecialCaseHandler } from "./types";

/**
 * If a combat where you are the attacker ends in a tie, recall ALL units instead. (Send them to
 * base. This isn't a move. Ties are calculated after combat damage is dealt.)
 *
 * Moot — tie detection ("both sides fully wiped simultaneously" vs. one side winning) isn't
 * modeled; combat resolution doesn't distinguish this case from a normal double-KO (deferred,
 * see docs/data-sourcing.md). No fallback mode.
 */
export const symbolOfTheSolari: SpecialCaseHandler = {
  cardId: "symbol-of-the-solari",
};
