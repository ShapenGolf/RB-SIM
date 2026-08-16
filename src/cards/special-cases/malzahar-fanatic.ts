import type { SpecialCaseHandler } from "./types";

/**
 * Kill a friendly unit or gear, Exhaust: [Action] — [Add] Rune Rune. (Use on your turn or in
 * showdowns. Abilities that add resources can't be reacted to.)
 *
 * Moot — the sole effect is [Add], which is unimplemented (deferred, see ancient-henge.ts's
 * identical note). Not worth exposing the "kill a friendly unit or gear" cost for an ability
 * that would produce no observable effect.
 */
export const malzaharFanatic: SpecialCaseHandler = {
  cardId: "malzahar-fanatic",
};
