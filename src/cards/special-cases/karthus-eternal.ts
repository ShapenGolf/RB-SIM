import type { SpecialCaseHandler } from "./types";

/**
 * Your [Deathknell] effects trigger an additional time.
 *
 * Moot — the generic Deathknell keyword only marks that a Deathknell fired; each card's actual
 * effect is bespoke onDestroy logic in its own handler (~27 of them). Doubling all of them
 * indiscriminately would risk affecting onDestroy handlers that do things beyond their printed
 * Deathknell text, and verifying all 27 individually is out of scope for one card (deferred, see
 * docs/data-sourcing.md). No fallback mode.
 */
export const karthusEternal: SpecialCaseHandler = {
  cardId: "karthus-eternal",
};
