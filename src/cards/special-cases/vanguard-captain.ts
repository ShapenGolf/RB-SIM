import type { SpecialCaseHandler } from "./types";
import { KeywordEngine } from "../../keywords/registry";
import { playTokenHere } from "./token-helpers";

/** [Legion] — When you play me, play two 1 Might Recruit unit tokens here. (Get the effect if you've played another card this turn.) */
export const vanguardCaptain: SpecialCaseHandler = {
  cardId: "vanguard-captain",
  onPlay: (ctx) => {
    if (!KeywordEngine.conditionalTriggerActive(ctx.game, ctx.card, ctx.instance)) return;
    playTokenHere(ctx.game, "token-recruit", ctx.instance.controller, ctx.instance);
    playTokenHere(ctx.game, "token-recruit", ctx.instance.controller, ctx.instance);
  },
};
