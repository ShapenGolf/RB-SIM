import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import type { SpecialCaseHandler } from "./types";

const FREE_IF_COST_AT_MOST = 2;

/**
 * Reveal the top 2 cards of your Main Deck. You may play one of them, reducing its cost by 2
 * Energy. Draw any you did not play this way.
 *
 * Simplification: this engine has no partial-cost-payment flow for a reveal-and-play effect
 * (only full-cost or fully-ignored — see docs/data-sourcing.md), so if either revealed card
 * costs 2 Energy or less (i.e. it would be free after the reduction), it's played via
 * playCardIgnoringCost as the closest approximation; otherwise both cards are just drawn. No
 * player choice between two eligible cards — prefers the higher-cost one (more value gained
 * from the reduction).
 */
export const voidRush: SpecialCaseHandler = {
  cardId: "void-rush",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const revealed = [player.mainDeck.shift(), player.mainDeck.shift()].filter((id): id is string => Boolean(id));
    const eligible = revealed
      .filter((id) => {
        const card = getCard(id);
        return card.energyCost !== null && card.energyCost <= FREE_IF_COST_AT_MOST;
      })
      .sort((a, b) => (getCard(b).energyCost ?? 0) - (getCard(a).energyCost ?? 0));

    const played = eligible[0];
    for (const id of revealed) {
      if (id === played) {
        playCardIgnoringCost(ctx.game, ctx.instance.controller, id);
      } else {
        player.hand.push(id);
      }
    }
  },
};
