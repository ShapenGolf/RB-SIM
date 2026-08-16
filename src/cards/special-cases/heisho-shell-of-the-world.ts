import type { SpecialCaseHandler } from "./types";

/**
 * Players ignore [Deflect] while paying for spells and abilities choosing something here.
 *
 * Moot — Deflect's extraTargetingCost hook isn't enforced anywhere in the engine, for any card
 * (see spirits-refuge.ts's identical note).
 */
export const heishoShellOfTheWorld: SpecialCaseHandler = {
  cardId: "heisho-shell-of-the-world",
};
