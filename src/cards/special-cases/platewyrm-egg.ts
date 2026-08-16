import type { SpecialCaseHandler } from "./types";

/**
 * This enters exhausted.
 * [Empower] — 1 Energy, Exhaust (Pay the cost: Empower this. Use only if not Empowered.)
 * [Reaction][>] Exhaust: [Add] 1 Energy. If this is [Empowered], [Add] 2 Energy instead.
 *
 * "Enters exhausted" needs no special case (see honeyfruit.ts's identical note). The only
 * observable payoff of Empowering this would be a bigger [Add], which is unimplemented (deferred,
 * see ancient-henge.ts's identical note) — so the Empower cost isn't exposed either, since paying
 * it would have no effect.
 */
export const platewyrmEgg: SpecialCaseHandler = {
  cardId: "platewyrm-egg",
};
