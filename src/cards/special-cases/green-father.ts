import type { SpecialCaseHandler } from "./types";

/**
 * When you conquer or hold, you may exhaust me to replace that battlefield with a Brush
 * battlefield token. (Bird, Cat, Dog, Poro, and Ivern units have +1 Might in Brush. It can be
 * swapped back when scored.)
 *
 * Moot — no "Brush battlefield" token exists in this project's card data yet, and "swapped back
 * when scored" needs its own tracking; building both plus the tag-conditional Might grant is a
 * real new feature, not a small chokepoint fix for one card (deferred, see
 * docs/data-sourcing.md). No fallback mode.
 */
export const greenFather: SpecialCaseHandler = {
  cardId: "green-father",
};
