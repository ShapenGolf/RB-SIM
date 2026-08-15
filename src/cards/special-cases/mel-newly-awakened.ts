import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, draw 1.
 * [Empower] 3 Energy.
 * [Empowered][>] Your spells and abilities can't be countered. If a spell or ability you
 * control would give -Might to a unit it chooses, it gives an additional -1 Might.
 *
 * Known gap: the Empowered static effect isn't modeled — this engine has no "counter" mechanic
 * to prevent, and no generic "-Might chosen effect" bonus hook (see docs/data-sourcing.md).
 * Only the onPlay draw and the Empower cost are implemented.
 */
export const melNewlyAwakened: SpecialCaseHandler = {
  cardId: "mel-newly-awakened",
  empowerCost: { energy: 3 },
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
