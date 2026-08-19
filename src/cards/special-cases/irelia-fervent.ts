import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * [Deflect] (Opponents must pay Rune to choose me with a spell or ability.)
 * When you choose or ready me, give me +1 Might this turn.
 *
 * [Deflect] is a printed keyword, already generic (enforcement gap is the usual moot no-op, see
 * allay-eager-admirer.ts). The trigger clause uses the generic "chosen as a target" broadcast
 * (onChosenAsTarget, see jae-medarda.ts) and the "became ready" broadcast (onBecameReady, see
 * ready-helpers.ts) — "you" is Irelia's own controller, so only a self-targeting choice counts.
 */
export const ireliaFervent: SpecialCaseHandler = {
  cardId: "irelia-fervent",
  onChosenAsTarget: (ctx, chooser) => {
    if (chooser !== ctx.instance.controller) return;
    ctx.instance.tempMightBonus += MIGHT_BONUS;
  },
  onBecameReady: (ctx) => {
    ctx.instance.tempMightBonus += MIGHT_BONUS;
  },
};
