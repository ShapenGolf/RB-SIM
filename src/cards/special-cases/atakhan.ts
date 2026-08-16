import type { SpecialCaseHandler } from "./types";

/**
 * You may kill a friendly unit as an additional cost to play me. If you do, I cost 1 Energy less
 * for each Energy it costs and Order Rune less for each Power it costs.
 * [Ganking] (I can move from battlefield to battlefield.)
 * When I attack, the defender must kill one of their units here.
 *
 * [Ganking] is a printed keyword, already generic. The additional-cost clause is moot (same
 * variable-scaling mismatch as commander-ledros.ts's identical note). "Defender must kill a
 * unit" on attack isn't modeled either (no generic "forced kill" attack trigger). No fallback
 * mode.
 */
export const atakhan: SpecialCaseHandler = {
  cardId: "atakhan",
};
