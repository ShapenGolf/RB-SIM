import type { SpecialCaseHandler } from "./types";

/**
 * While you control this battlefield, friendly [Repeat] costs cost 1 Energy less.
 *
 * Moot — [Repeat] isn't modeled (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const maraiSpire: SpecialCaseHandler = {
  cardId: "marai-spire",
};
