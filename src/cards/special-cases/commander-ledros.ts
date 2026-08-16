import type { SpecialCaseHandler } from "./types";

/**
 * As you play me, you may kill any number of friendly units as an additional cost. Reduce my
 * cost by Order Rune for each killed this way.
 * [Deflect] (Opponents must pay Rune to choose me with a spell or ability.)
 * [Ganking] (I can move from battlefield to battlefield.)
 *
 * [Deflect]/[Ganking] are printed keywords, already generic (Deflect's enforcement gap is the
 * usual moot no-op, see allay-eager-admirer.ts). The additional-cost clause is moot — this
 * engine's additional-cost system (additionalCostDiscardForReduction / additionalCostXPForReduction)
 * only supports a single FIXED discard/XP amount for a FIXED reduction, not "kill any number,
 * reduction scales with however many you choose" (deferred, see docs/data-sourcing.md).
 */
export const commanderLedros: SpecialCaseHandler = {
  cardId: "commander-ledros",
};
