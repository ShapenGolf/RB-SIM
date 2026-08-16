import type { SpecialCaseHandler } from "./types";

/**
 * Play me only to a battlefield you conquered this turn. (You can't play me anywhere else.)
 *
 * Moot — this engine has no "battlefield conquered this turn" tracking (would need a new
 * per-battlefield, per-turn state field with its own reset wiring — deferred, see
 * docs/data-sourcing.md). No fallback mode: the restriction can't be enforced, and playing this
 * unconditionally like a normal unit would be a strictly-worse simplification than not
 * implementing it at all.
 */
export const perchedGrimwyrm: SpecialCaseHandler = {
  cardId: "perched-grimwyrm",
};
