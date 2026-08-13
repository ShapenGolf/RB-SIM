import type { SpecialCaseHandler } from "./types";
import { KeywordEngine } from "../../keywords/registry";

/** [Legion] — When you play me, buff me. (Get the effect if you've played another card this turn.) */
export const trifarianGloryseeker: SpecialCaseHandler = {
  cardId: "trifarian-gloryseeker",
  onPlay: (ctx) => {
    if (!KeywordEngine.conditionalTriggerActive(ctx.game, ctx.card, ctx.instance)) return;
    ctx.instance.statuses.buffed = true;
  },
};
