import type { SpecialCaseHandler } from "./types";

/**
 * At the start of your Beginning Phase, if you control a facedown card at a battlefield, draw 1.
 *
 * Moot — this engine's Hidden zone (game/state.ts's `hiddenZone`) is a private reserve, not a
 * face-down occupant of an actual Battlefield slot (a simplification: real Hidden units are
 * played face-down directly onto a Battlefield, occupying a real board position; here they just
 * sit in a hand-like list until played for free). "A facedown card at a battlefield" therefore
 * isn't a state this engine can query. No fallback mode.
 */
export const mushroomPouch: SpecialCaseHandler = {
  cardId: "mushroom-pouch",
};
