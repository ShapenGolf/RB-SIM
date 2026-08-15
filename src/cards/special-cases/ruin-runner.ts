import type { SpecialCaseHandler } from "./types";

/**
 * I can't be chosen by enemy spells and abilities.
 *
 * Target-immunity isn't enforced anywhere in the engine (no generic "can't be chosen" check at
 * any targeting chokepoint — see docs/data-sourcing.md, same gap as Alpha Wildclaw/Baron Nashor).
 */
export const ruinRunner: SpecialCaseHandler = {
  cardId: "ruin-runner",
};
