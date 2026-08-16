import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — Pay any amount of Energy to [Add] that much Rune. (Abilities that add
 * resources can't be reacted to.)
 *
 * Moot — entirely gated behind [Add], a resource-generation keyword this engine has no infra
 * for (deferred: modeling floating, use-restricted resources beyond the existing rune
 * pool/Energy system would be a significant new subsystem, not a small chokepoint fix — see
 * docs/data-sourcing.md). No fallback mode.
 */
export const ancientHenge: SpecialCaseHandler = {
  cardId: "ancient-henge",
};
