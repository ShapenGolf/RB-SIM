import type { SpecialCaseHandler } from "./types";

/**
 * [Deflect] (printed keyword, already wired via extraTargetingCost — see keywords/handlers/deflect.ts.)
 * While I'm at a battlefield, your other units here have [Deflect].
 *
 * The grant is a no-op: Deflect's `extraTargetingCost` keyword hook exists but nothing in
 * moves.ts/the UI enforces it anywhere in the engine, for any card (see spirits-refuge.ts's
 * identical note) — so granting it here would have no observable effect regardless.
 */
export const allayEagerAdmirer: SpecialCaseHandler = {
  cardId: "allay-eager-admirer",
};
