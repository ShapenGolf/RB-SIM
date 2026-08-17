import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] Choose a battlefield. An opponent reveals their hand. You may choose a unit from it.
 * They play that unit to that battlefield, ignoring any and all costs. When they do, [Stun] it.
 *
 * Moot — [Hidden] itself is real now (see game/moves.ts hideCard/playFromHidden), but this
 * card's OWN effect needs an interactive "opponent reveals hand, you choose a card from it" UI
 * step that doesn't exist anywhere in this engine (deferred, see docs/data-sourcing.md). No
 * fallback mode.
 */
export const boneSkewer: SpecialCaseHandler = {
  cardId: "bone-skewer",
};
