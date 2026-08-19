import type { SpecialCaseHandler } from "./types";

/**
 * [Legion][>] You may play me from your trash for 3 EnergyFury Rune. (Get the effect if you've
 * played another card this turn.)
 *
 * [Legion]'s conditional-trigger check (keywords/handlers/legion.ts) is implemented, and a
 * playFromTrash move now exists (added for [Flow], see game/moves.ts) — but that move is scoped
 * to Card.flowCost (parsed from the generic "flow" keyword), and this card's trash-play option is
 * a DIFFERENT, [Legion]-gated ability with its own hardcoded cost, not [Flow] at all. Reusing
 * playFromTrash correctly would need it to accept a second cost source (a per-card "Legion trash
 * cost" alongside flowCost) AND a Legion-conditional gate checked at the move level (not just
 * inside the resolved effect) — a real but comparatively small extension, left as the next step
 * rather than done opportunistically here (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const undyingLegion: SpecialCaseHandler = {
  cardId: "undying-legion",
};
