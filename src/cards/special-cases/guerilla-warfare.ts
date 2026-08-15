import { getCard } from "../db";
import { KeywordEngine } from "../../keywords/registry";
import type { SpecialCaseHandler } from "./types";

const MAX_RETURNED = 2;

/**
 * Return up to two cards with [Hidden] from your trash to your hand. You can hide cards
 * ignoring costs this turn.
 *
 * "Hide cards ignoring costs" is moot — Hidden's face-down zone isn't modeled (see
 * docs/data-sourcing.md) — so only the trash-recovery half is implemented.
 */
export const guerillaWarfare: SpecialCaseHandler = {
  cardId: "guerilla-warfare",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    let returned = 0;
    for (let i = player.trash.length - 1; i >= 0 && returned < MAX_RETURNED; i -= 1) {
      const cardId = player.trash[i];
      if (!KeywordEngine.hasKeyword(getCard(cardId), "hidden")) continue;
      player.trash.splice(i, 1);
      player.hand.push(cardId);
      returned += 1;
    }
  },
};
