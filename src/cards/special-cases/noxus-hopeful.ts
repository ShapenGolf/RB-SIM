import type { SpecialCaseHandler } from "./types";
import { KeywordEngine } from "../../keywords/registry";

/** Legion — I cost 2 Energy less. (Get the effect if you've played another card this turn.) */
export const noxusHopeful: SpecialCaseHandler = {
  cardId: "noxus-hopeful",
  costReduction: (ctx) =>
    KeywordEngine.conditionalTriggerActive(ctx.game, ctx.card, ctx.instance) ? 2 : 0,
};
