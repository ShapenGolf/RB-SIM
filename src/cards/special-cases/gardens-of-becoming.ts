import type { SpecialCaseHandler } from "./types";

/**
 * Units here have "Exhaust: Gain 1 XP."
 *
 * Moot — this engine has no mechanism for a Battlefield to grant a NEW activated ability to
 * arbitrary units sitting there (activated abilities are defined per-card via specialCaseId /
 * card.activatedAbility, not dynamically composed from external grants — deferred, see
 * docs/data-sourcing.md). No fallback mode.
 */
export const gardensOfBecoming: SpecialCaseHandler = {
  cardId: "gardens-of-becoming",
};
