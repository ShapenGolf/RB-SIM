import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 4 EnergyCalm Rune.
 * Opponents' spells cost 1 Energy more. If this is [Empowered], they cost 1 EnergyRune more
 * instead.
 *
 * Known gap: the Empowered variant's extra Domain-Rune component isn't charged (Domain-Rune-only
 * cost additions aren't modeled — see docs/data-sourcing.md); the flat +1 Energy always applies
 * regardless of Empowered state.
 */
export const helmOfSuppression: SpecialCaseHandler = {
  cardId: "helm-of-suppression",
  empowerCost: { energy: 4, runeDomain: "Calm" },
  costIncreaseForEnemy: (_ctx, playedCard) => (playedCard.type === "spell" ? 1 : 0),
};
