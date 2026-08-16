import type { SpecialCaseHandler } from "./types";

/**
 * [Deflect] (Opponents must pay Rune to choose me with a spell or ability.)
 * When you choose or ready me, give me +1 Might this turn.
 *
 * [Deflect] is a printed keyword, already generic (enforcement gap is the usual moot no-op, see
 * allay-eager-admirer.ts). The trigger clause is moot — needs both the "chosen as a target"
 * broadcast (see jae-medarda.ts) and the "became ready" broadcast (see mageseeker-warden.ts),
 * neither of which exist. No fallback mode.
 */
export const ireliaFervent: SpecialCaseHandler = {
  cardId: "irelia-fervent",
};
