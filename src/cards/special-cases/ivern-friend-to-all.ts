import { getCard } from "../db";
import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

const TRIBAL_TAGS = ["Bird", "Cat", "Dog", "Poro"];

function tribalTagsPresent(ctx: SpecialCaseContext): Set<string> {
  const present = new Set<string>();
  for (const instance of Object.values(ctx.game.instances)) {
    if (instance.controller !== ctx.instance.controller) continue;
    const card = getCard(instance.cardId);
    for (const tag of card.tags ?? []) {
      if (TRIBAL_TAGS.includes(tag)) present.add(tag);
    }
    for (const tag of TRIBAL_TAGS) {
      if (instance.statuses[`grantedTag${tag}`]) present.add(tag);
    }
  }
  return present;
}

/**
 * As you play me, choose Bird, Cat, Dog, or Poro. I gain that tag.
 * When I conquer or hold, score 1 point if your units have all of the following tags among them
 * — Bird, Cat, Dog, and Poro.
 *
 * No player choice of which tag (see docs/data-sourcing.md) — auto-picks whichever of the four
 * the controller currently has the fewest of, to maximize the chance of completing the set.
 * "Gained tag" is tracked via a statuses.grantedTag<Tag> boolean (no new CardInstance field/
 * factory-site plumbing needed, unlike Ganking/Backline-style hooks) — read alongside printed
 * card.tags by the scoring check (mirrors daisy.ts's tribalTagsPresent, extended for grants).
 */
export const ivernFriendToAll: SpecialCaseHandler = {
  cardId: "ivern-friend-to-all",
  onPlay: (ctx) => {
    const present = tribalTagsPresent(ctx);
    let chosen = TRIBAL_TAGS[0];
    for (const tag of TRIBAL_TAGS) {
      if (!present.has(tag)) {
        chosen = tag;
        break;
      }
    }
    ctx.instance.statuses[`grantedTag${chosen}`] = true;
  },
  onConquer: (ctx) => {
    if (tribalTagsPresent(ctx).size === TRIBAL_TAGS.length) {
      ctx.game.players[ctx.instance.controller].points += 1;
    }
  },
  onHold: (ctx) => {
    if (tribalTagsPresent(ctx).size === TRIBAL_TAGS.length) {
      ctx.game.players[ctx.instance.controller].points += 1;
    }
  },
};
