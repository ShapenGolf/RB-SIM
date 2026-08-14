import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/** Kill an enemy Chaos (Chaos Rune) unit or gear. */
export const decreeOfUnity: SpecialCaseHandler = {
  cardId: "decree-of-unity",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    const targetCard = getCard(target.cardId);
    if ((targetCard.type !== "unit" && targetCard.type !== "champion" && targetCard.type !== "gear") || !targetCard.domains.includes("Chaos")) {
      return;
    }
    destroyInstance(ctx.game, getCard, targetInstanceId);
  },
};
