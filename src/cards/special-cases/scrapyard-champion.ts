import type { SpecialCaseHandler } from "./types";
import { KeywordEngine } from "../../keywords/registry";
import { getCard } from "../db";
import { discardCardToTrash } from "../../game/discardEngine";

/** Legion — When you play me, discard 2, then draw 2. (Get the effect if you've played another card this turn.) */
export const scrapyardChampion: SpecialCaseHandler = {
  cardId: "scrapyard-champion",
  onPlay: (ctx) => {
    if (!KeywordEngine.conditionalTriggerActive(ctx.game, ctx.card, ctx.instance)) return;
    const controller = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const discarded = controller.hand.shift();
      if (discarded) discardCardToTrash(ctx.game, getCard, ctx.instance.controller, discarded);
    }
    for (let i = 0; i < 2; i += 1) {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
