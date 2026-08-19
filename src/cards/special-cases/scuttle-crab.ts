import type { SpecialCaseHandler } from "./types";
import { gainXP } from "../../game/templatedEffectEngine";

const XP_GAIN = 1;

/**
 * (Units with 0 Might can conquer and hold.)
 * When you play me, draw 1.
 * [Deathknell] Choose an opponent. They reveal their hand. You can look at their facedown cards
 * this turn. Gain 1 XP.
 *
 * The reveal/facedown-peek clauses are pure information for a human player already sharing one
 * screen in this hotseat simulator (see docs/data-sourcing.md) — no game state change is needed
 * for them, so only the draw and XP gain are implemented.
 */
export const scuttleCrab: SpecialCaseHandler = {
  cardId: "scuttle-crab",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
  onDestroy: (ctx) => {
    gainXP(ctx.game.players[ctx.instance.controller], XP_GAIN);
  },
};
