import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] (Hide now for Rune to react with later for 0 Energy.) When you play this from face
 * down, attach it to a unit you control here. [Equip] Chaos Rune (Chaos Rune: Attach this to a
 * unit you control.)
 *
 * [Equip] already works generically (see game/equip.ts / moves.ts equipGear) — a player can
 * always manually attach this for its Chaos Rune cost. Only the [Hidden]-specific "auto-attach
 * when played from face down" clause is unmodeled (Hidden's face-down zone isn't tracked — see
 * docs/data-sourcing.md), which is a strict subset of what Equip already provides.
 */
export const edgeOfNight: SpecialCaseHandler = {
  cardId: "edge-of-night",
};
