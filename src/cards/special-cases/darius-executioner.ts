import type { SpecialCaseHandler } from "./types";
import { KeywordEngine } from "../../keywords/registry";

/** [Legion] — When you play me, ready me. / Other friendly units have +1 Might here. */
export const dariusExecutioner: SpecialCaseHandler = {
  cardId: "darius-executioner",
  onPlay: (ctx) => {
    if (KeywordEngine.conditionalTriggerActive(ctx.game, ctx.card, ctx.instance)) {
      ctx.instance.exhausted = false;
    }
  },
  staticMightModifierForAlly: (ctx, ally) => {
    if (ctx.instance.battlefieldIndex === null) return 0;
    return ally.battlefieldIndex === ctx.instance.battlefieldIndex ? 1 : 0;
  },
};
