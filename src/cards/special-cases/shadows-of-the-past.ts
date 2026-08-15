import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const MAX_RETURNED = 2;

/**
 * Return up to 2 units from trashes to their owners' hands.
 *
 * Simplification: no player choice of which units or whose trash (see docs/data-sourcing.md) —
 * only returns from the controller's own trash, the strictly beneficial reading (returning an
 * opponent's unit from their trash to their hand would help them, not the caster).
 */
export const shadowsOfThePast: SpecialCaseHandler = {
  cardId: "shadows-of-the-past",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    let returned = 0;
    for (let i = player.trash.length - 1; i >= 0 && returned < MAX_RETURNED; i -= 1) {
      const cardId = player.trash[i];
      const t = getCard(cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      player.trash.splice(i, 1);
      player.hand.push(cardId);
      returned += 1;
    }
  },
};
