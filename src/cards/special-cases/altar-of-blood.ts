import type { SpecialCaseHandler } from "./types";

/**
 * If a unit here would die during combat, its controller may pay Rune Rune Rune to heal it,
 * exhaust it, and recall it instead.
 *
 * Moot — the existing preventsAllyDeath scan (registry.ts) only reaches instances that share the
 * SAME controller as the warding card, which fits location-scoped wards like Soraka but not a
 * Battlefield that must protect EITHER side's units at its own location regardless of who
 * controls the Battlefield. Also combat-only (not spell death), unlike the existing hook.
 * Reusing/extending that chokepoint correctly for this shape is out of scope right now
 * (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const altarOfBlood: SpecialCaseHandler = {
  cardId: "altar-of-blood",
};
