import type { SpecialCaseContext, SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { applyStun } from "./stun";

const TRIBAL_TAGS = ["Bird", "Cat", "Dog", "Poro"];

function tribalTagsPresent(ctx: SpecialCaseContext): number {
  const present = new Set<string>();
  for (const instance of Object.values(ctx.game.instances)) {
    if (instance.controller !== ctx.instance.controller) continue;
    const card = getCard(instance.cardId);
    if (card.type !== "unit" && card.type !== "champion") continue;
    for (const tag of card.tags ?? []) {
      if (TRIBAL_TAGS.includes(tag)) present.add(tag);
    }
  }
  return present.size;
}

/**
 * I enter ready.
 * Reduce my cost by 1 Energy for each of the following tags among your units — Bird, Cat, Dog,
 * and Poro.
 * When I attack while your units have all 4 tags, [Stun] an enemy unit here.
 *
 * Simplification: no player choice of which enemy unit is stunned (see docs/data-sourcing.md) —
 * stuns the first one found at the battlefield.
 */
export const daisy: SpecialCaseHandler = {
  cardId: "daisy",
  selfEntersReady: () => true,
  costReduction: (ctx) => tribalTagsPresent(ctx),
  onAttack: (ctx) => {
    if (tribalTagsPresent(ctx) < TRIBAL_TAGS.length) return;
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const targetId = slot.units[opponentId][0];
    if (!targetId) return;
    const target = ctx.game.instances[targetId];
    if (!target) return;
    applyStun(ctx.game, getCard, target, ctx.instance.controller);
  },
};
