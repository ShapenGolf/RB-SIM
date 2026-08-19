import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { gainXP } from "../../game/templatedEffectEngine";

/** When you play me, gain 1 XP for each friendly unit. */
export const scrutinizingSergeant: SpecialCaseHandler = {
  cardId: "scrutinizing-sergeant",
  onPlay: (ctx) => {
    const count = Object.values(ctx.game.instances).filter((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    }).length;
    gainXP(ctx.game.players[ctx.instance.controller], count);
  },
};
