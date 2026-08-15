import type { SpecialCaseHandler } from "./types";

const BURN_AMOUNT = 7;

/**
 * When you play this, banish your hand and trash, then [Burn 7].
 * Skip your Draw Phase.
 * You may play cards from your trash.
 * If a card would go to your trash from anywhere other than your Main Deck, banish it instead.
 *
 * Known gap: "You may play cards from your trash" (an ongoing alternate-zone play permission)
 * and the trash-to-banishment redirect aren't modeled — this engine has no generic "play from
 * trash" permission system or a trash-push interception point (see docs/data-sourcing.md). Only
 * the onPlay banish/burn effect and the Draw Phase skip are implemented.
 */
export const endlessRiches: SpecialCaseHandler = {
  cardId: "endless-riches",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    player.banishment.push(...player.hand);
    player.hand = [];
    player.banishment.push(...player.trash);
    player.trash = [];
    for (let i = 0; i < BURN_AMOUNT; i += 1) {
      const burned = player.mainDeck.shift();
      if (burned) player.trash.push(burned);
    }
  },
  blocksOwnDrawPhase: () => true,
};
