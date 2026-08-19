import type { SpecialCaseHandler } from "./types";

/**
 * If a unit here would die during combat, its controller may pay Rune Rune Rune to heal it,
 * exhaust it, and recall it instead.
 *
 * Moot — two blockers, one now smaller than it looks. The bare "Rune Rune Rune" payment itself
 * is no longer the hard part (this session's [Flow] work added a real domain-less "pay N Runes
 * of ANY domain" payment shape, and PendingOptionalCost already models "you may pay X to Y"
 * reactive offers). The genuine blocker is timing: this is a REPLACEMENT effect that must
 * intercept a fatal hit mid-combat-resolution, offer the choice, and only THEN either let the
 * unit die normally or substitute heal+exhaust+recall — but game/combat.ts's assignDamage applies
 * damage and calls destroyInstance synchronously in one pass, with no pause point for a reactive
 * player decision partway through (unlike PendingDamageAssignment, which pauses BEFORE damage is
 * applied, or PendingOptionalCost's existing offers, which all fire AFTER their triggering event
 * is already fully resolved). preventsAllyDeath (the closest existing hook) is also the wrong
 * shape for a different reason — it only reaches instances sharing the warding card's own
 * controller, not "either side's units here" — but that mismatch is secondary to the timing
 * problem. Splitting combat resolution to support a genuine mid-resolution pause is out of scope
 * here (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const altarOfBlood: SpecialCaseHandler = {
  cardId: "altar-of-blood",
};
