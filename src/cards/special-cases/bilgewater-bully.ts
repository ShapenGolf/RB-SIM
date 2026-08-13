import type { SpecialCaseHandler } from "./types";

/**
 * While I'm buffed, I have Ganking.
 *
 * Data quirk (see docs/data-sourcing.md "Bekannte Einschränkungen"): the bracket-import can't
 * tell a conditionally-granted keyword from a printed one, so this card's `keywords` array
 * already carries an unconditional "ganking". Defining `hasConditionalGanking` here overrides
 * that printed keyword entirely (see registry.ts) so movement is correctly gated on buffed.
 */
export const bilgewaterBully: SpecialCaseHandler = {
  cardId: "bilgewater-bully",
  hasConditionalGanking: (ctx) => Boolean(ctx.instance.statuses.buffed),
};
