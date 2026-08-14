import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { discardCardToTrash } from "../../game/discardEngine";

const READY_RUNES_MAX = 2;
const UNIT_MIGHT_BONUS = 3;

/**
 * When I move, draw 1, then discard 1. Then, based on the discarded card's type: Spell — draw 1.
 * Gear — ready up to 2 runes. Unit — give me +3 Might this turn.
 *
 * Simplification: no player choice of which card to discard (see docs/data-sourcing.md) —
 * discards the front of hand.
 */
export const hweiBroodingPainter: SpecialCaseHandler = {
  cardId: "hwei-brooding-painter",
  onMove: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);

    const discardedId = player.hand.shift();
    if (!discardedId) return;
    discardCardToTrash(ctx.game, getCard, ctx.instance.controller, discardedId);

    const type = getCard(discardedId).type;
    if (type === "spell") {
      const drawn2 = player.mainDeck.shift();
      if (drawn2) player.hand.push(drawn2);
    } else if (type === "gear") {
      const exhausted = player.runePool.filter((r) => r.exhausted).slice(0, READY_RUNES_MAX);
      for (const rune of exhausted) rune.exhausted = false;
    } else if (type === "unit" || type === "champion") {
      ctx.instance.tempMightBonus += UNIT_MIGHT_BONUS;
    }
  },
};
