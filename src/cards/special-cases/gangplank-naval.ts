import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] Body Rune Body Rune (Use only if not Empowered.)
 * [Empowered][>] If a spell or ability that chooses me would stun me, give me -Might, or return
 * me to hand, give me +3 Might instead.
 *
 * Moot — a targeted-effect REPLACEMENT ("would X, instead Y") has no interception layer in this
 * engine; stun/Might-loss/bounce effects each apply directly with no shared chokepoint to redirect
 * from (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const gangplankNaval: SpecialCaseHandler = {
  cardId: "gangplank-naval",
};
