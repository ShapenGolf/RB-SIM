import type { SpecialCaseHandler } from "./types";

/**
 * While you control this battlefield, friendly legends have "Exhaust: Attach an Equipment you
 * control to a unit you control."
 *
 * Moot — no mechanism for a Battlefield to grant a new activated ability to arbitrary Legends
 * (deferred, see gardens-of-becoming.ts's identical note). No fallback mode.
 */
export const forgeOfTheFluft: SpecialCaseHandler = {
  cardId: "forge-of-the-fluft",
};
