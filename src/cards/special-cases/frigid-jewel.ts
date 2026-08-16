import type { SpecialCaseHandler } from "./types";

/**
 * When you draw your second card each turn, give a friendly unit +2 Might this turn.
 *
 * Moot — this engine has no "cards drawn this turn" counter; draws happen at ~107 scattered
 * mainDeck.shift() call sites with no shared chokepoint (deferred, see docs/data-sourcing.md).
 * No fallback mode.
 */
export const frigidJewel: SpecialCaseHandler = {
  cardId: "frigid-jewel",
};
