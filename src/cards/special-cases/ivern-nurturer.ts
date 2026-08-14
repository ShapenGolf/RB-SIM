import type { SpecialCaseContext, SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const TRIBAL_TAGS = ["Bird", "Cat", "Dog", "Poro"];
const LOOK_COUNT = 3;

/**
 * When you play me or when I hold, look at the top 3 cards of your Main Deck. You may reveal a
 * unit from among them and draw it. Recycle the rest. Then if you revealed a Bird, Cat, Dog, or
 * Poro, [Buff] a friendly unit.
 *
 * Simplification: the "may reveal" auto-resolves to taking the first eligible unit found (no
 * real downside — same precedent as Zenith Blade/Fate Weaver), and the buff target has no player
 * choice, landing on the first friendly unit/champion found (same precedent as Vanguard Helm).
 */
function lookAndDraw(ctx: SpecialCaseContext): void {
  const player = ctx.game.players[ctx.instance.controller];
  const looked: string[] = [];
  for (let i = 0; i < LOOK_COUNT; i += 1) {
    const card = player.mainDeck.shift();
    if (card) looked.push(card);
  }

  const unitIndex = looked.findIndex((cardId) => {
    const type = getCard(cardId).type;
    return type === "unit" || type === "champion";
  });

  let drawnCardId: string | undefined;
  if (unitIndex !== -1) {
    drawnCardId = looked[unitIndex];
    player.hand.push(drawnCardId);
    looked.splice(unitIndex, 1);
  }
  player.mainDeck.push(...looked);

  if (!drawnCardId) return;
  const tags = getCard(drawnCardId).tags ?? [];
  if (!tags.some((tag) => TRIBAL_TAGS.includes(tag))) return;

  const target = Object.values(ctx.game.instances).find((i) => {
    if (i.controller !== ctx.instance.controller) return false;
    const type = getCard(i.cardId).type;
    return type === "unit" || type === "champion";
  });
  if (target) target.statuses.buffed = true;
}

export const ivernNurturer: SpecialCaseHandler = {
  cardId: "ivern-nurturer",
  onPlay: (ctx) => lookAndDraw(ctx),
  onHold: (ctx) => lookAndDraw(ctx),
};
