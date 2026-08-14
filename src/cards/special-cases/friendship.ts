import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const TRIBAL_TAGS = ["Bird", "Cat", "Dog", "Poro"];

/** [Reaction] Choose a unit. Give it +1 Might this turn for each of the following tags among your units — Bird, Cat, Dog, and Poro. */
export const friendship: SpecialCaseHandler = {
  cardId: "friendship",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;

    const present = new Set<string>();
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const card = getCard(instance.cardId);
      if (card.type !== "unit" && card.type !== "champion") continue;
      for (const tag of card.tags ?? []) {
        if (TRIBAL_TAGS.includes(tag)) present.add(tag);
      }
    }
    target.tempMightBonus += present.size;
  },
};
