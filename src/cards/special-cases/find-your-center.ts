import type { SpecialCaseHandler } from "./types";
import { WIN_SCORE } from "../../game/turnFlow";

const NEAR_VICTORY_MARGIN = 3;

/** If an opponent's score is within 3 points of the Victory Score, this costs 2 Energy less. Draw 1 and channel 1 rune exhausted. */
export const findYourCenter: SpecialCaseHandler = {
  cardId: "find-your-center",
  costReduction: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const opponent = ctx.game.players[opponentId];
    return opponent.points >= WIN_SCORE - NEAR_VICTORY_MARGIN ? 2 : 0;
  },
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
    const rune = controller.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      controller.runePool.push(rune);
    }
  },
};
