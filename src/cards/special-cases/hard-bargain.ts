import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * [Repeat] 2 Energy.
 * Counter a spell unless its controller pays 2 Energy.
 *
 * Counter itself is now wired up (see wind-wall.ts and PendingSpellReaction), but this card still
 * has no home there: "unless its controller pays 2 Energy" needs the SPELL'S OWN CASTER to get a
 * further decision once countered (pay to save it or not) — a second, nested pending-decision this
 * engine has no mechanism for (PendingSpellReaction is a single, non-recursive window — see its
 * doc comment). [Repeat] is separately unmodeled (deferred, see docs/data-sourcing.md).
 */
export const hardBargain: SpecialCaseHandler = {
  cardId: "hard-bargain",
};
