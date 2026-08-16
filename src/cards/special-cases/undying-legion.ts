import type { SpecialCaseHandler } from "./types";

/**
 * [Legion][>] You may play me from your trash for 3 EnergyFury Rune. (Get the effect if you've
 * played another card this turn.)
 *
 * Moot — [Legion]'s conditional-trigger check (keywords/handlers/legion.ts) is implemented, but
 * "play a specific card from trash" as a standalone, always-available option (rather than a
 * reactive offer tied to a specific game event, e.g. immortal-phoenix.ts's onTrashKillWithSpell
 * pattern) has no move in the current UI/move surface — would need a new playFromTrash move
 * parallel to playCard, not a small chokepoint fix (deferred, see docs/data-sourcing.md). No
 * fallback mode.
 */
export const undyingLegion: SpecialCaseHandler = {
  cardId: "undying-legion",
};
