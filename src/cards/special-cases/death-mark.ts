import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

const BURN_AMOUNT = 3;

/**
 * [Burn 3]. (Put the top 3 cards of your Main Deck into your trash.) Play a 0 Might Shadow Clone
 * unit token. (It has "When I attack, you may banish a unit from your trash. If you do, give me
 * [Assault 4] this turn.") [Flow] 1 Energy Rune Rune (You may play this from your trash for its
 * Flow cost. Then banish it.)
 *
 * [Flow] (playing a spell again from the trash) isn't wired up as a generic mechanic — a
 * documented gap. The Shadow Clone token's own bespoke "When I attack..." text is deliberately
 * unmodeled — it plays as a vanilla 0 Might token, matching the established precedent in
 * zed-without-a-sound.ts.
 */
export const deathMark: SpecialCaseHandler = {
  cardId: "death-mark",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < BURN_AMOUNT; i += 1) {
      const burned = player.mainDeck.shift();
      if (burned) player.trash.push(burned);
    }
    playTokenToBase(ctx.game, "token-shadow-clone", ctx.instance.controller);
  },
};
