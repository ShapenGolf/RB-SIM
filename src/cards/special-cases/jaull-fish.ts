import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const MIGHTY_THRESHOLD = 5;

/** [Accelerate] I cost 2 Energy less for each of your [Mighty] units. (A unit is Mighty while it has 5+ Might.) */
export const jaullFish: SpecialCaseHandler = {
  cardId: "jaull-fish",
  costReduction: (ctx) => {
    const mightyCount = Object.values(ctx.game.instances).filter((i) => {
      if (i.instanceId === ctx.instance.instanceId) return false;
      if (i.controller !== ctx.instance.controller) return false;
      const card = getCard(i.cardId);
      if (card.type !== "unit" && card.type !== "champion") return false;
      return computeMight(ctx.game, getCard, i, "none") >= MIGHTY_THRESHOLD;
    }).length;
    return mightyCount * 2;
  },
};
