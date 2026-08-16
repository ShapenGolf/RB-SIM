import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] Rune Rune (Use only if not Empowered.)
 * Disempower this, Exhaust: Choose a player. They gain control of this and recall it. (Send it
 * to their base.)
 * At the end of your turn, kill this and deal 5 to all units you control.
 *
 * Moot — "gain control of" (permanently transferring an instance's controller) isn't modeled
 * anywhere in this engine (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const glowstone: SpecialCaseHandler = {
  cardId: "glowstone",
};
