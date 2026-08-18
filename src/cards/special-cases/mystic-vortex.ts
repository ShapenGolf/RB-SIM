import type { SpecialCaseHandler } from "./types";

/**
 * During showdowns here, cards with [Reaction] cost Rune more to play. (Hidden cards have
 * [Reaction].)
 *
 * Spells now have a real [Reaction] response window (see PendingSpellReaction), but combat
 * (Showdowns) still resolves in one synchronous step with no window of its own (see combat.ts) —
 * this card's whole premise ("during showdowns here") depends on combat-time reactions
 * specifically, which is a separate, not-yet-built extension of the same mechanism. No fallback
 * mode — a cost surcharge with nothing to apply it to has no partial version worth modeling.
 */
export const mysticVortex: SpecialCaseHandler = {
  cardId: "mystic-vortex",
};
