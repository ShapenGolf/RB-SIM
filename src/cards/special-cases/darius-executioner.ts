import type { SpecialCaseHandler } from "./types";
import { KeywordEngine } from "../../keywords/registry";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** [Legion] — When you play me, ready me. / Other friendly units have +1 Might here. */
export const dariusExecutioner: SpecialCaseHandler = {
  cardId: "darius-executioner",
  onPlay: (ctx) => {
    if (KeywordEngine.conditionalTriggerActive(ctx.game, ctx.card, ctx.instance)) {
      readyInstance(ctx.game, getCard, ctx.instance.instanceId);
    }
  },
  staticMightModifierForAlly: (ctx, ally) => {
    if (ctx.instance.battlefieldIndex === null) return 0;
    return ally.battlefieldIndex === ctx.instance.battlefieldIndex ? 1 : 0;
  },
};
