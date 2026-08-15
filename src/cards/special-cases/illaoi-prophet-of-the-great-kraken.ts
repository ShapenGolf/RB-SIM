import { getCard } from "../db";
import { playTokenToBase } from "./token-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When you play me or when I score, play a 1 Might Tentacle unit token from Bilgewater.
 * I have +1 Might for each token unit you control.
 *
 * Known gap: "when I score" isn't modeled — this engine's scoring step is player-level, not
 * tied to a specific unit (see docs/data-sourcing.md). Only the onPlay trigger is implemented.
 */
export const illaoiProphetOfTheGreatKraken: SpecialCaseHandler = {
  cardId: "illaoi-prophet-of-the-great-kraken",
  onPlay: (ctx) => {
    playTokenToBase(ctx.game, "token-tentacle", ctx.instance.controller);
  },
  staticMightModifier: (ctx) => {
    let count = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const card = getCard(instance.cardId);
      if (card.setCode !== "TOKEN") continue;
      if (card.type !== "unit" && card.type !== "champion") continue;
      count += 1;
    }
    return count;
  },
};
