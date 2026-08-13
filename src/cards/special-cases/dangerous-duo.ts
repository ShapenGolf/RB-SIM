import type { SpecialCaseHandler } from "./types";
import { KeywordEngine } from "../../keywords/registry";
import { getCard } from "../db";

/** Legion — if you've played another card this turn, give another Unit +2 Might for the rest of the turn. */
export const dangerousDuo: SpecialCaseHandler = {
  cardId: "dangerous-duo",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!KeywordEngine.conditionalTriggerActive(ctx.game, ctx.card, ctx.instance)) return;
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    const targetCard = getCard(target.cardId);
    if (targetCard.type !== "unit" && targetCard.type !== "champion") return;
    target.tempMightBonus += 2;
  },
};
