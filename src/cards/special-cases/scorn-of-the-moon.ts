import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction][>] Exhaust: [Add] 1 Energy. Spend this Energy only during showdowns. (Abilities that
 * add resources can't be reacted to.)
 *
 * Moot — entirely gated behind [Add] (deferred, see ancient-henge.ts's identical note).
 */
export const scornOfTheMoon: SpecialCaseHandler = {
  cardId: "scorn-of-the-moon",
};
