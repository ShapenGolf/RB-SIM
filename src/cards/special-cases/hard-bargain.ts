import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * [Repeat] 2 Energy.
 * Counter a spell unless its controller pays 2 Energy.
 *
 * Moot — entirely gated behind Counter (deferred, see abandon.ts's identical note); [Repeat] is
 * also unmodeled (deferred, see docs/data-sourcing.md), so there's no partial mode to fall back on.
 */
export const hardBargain: SpecialCaseHandler = {
  cardId: "hard-bargain",
};
