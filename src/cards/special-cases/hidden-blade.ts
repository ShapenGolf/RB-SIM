import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

const DRAW_COUNT = 2;

/**
 * Kill a unit at a battlefield. Its controller draws 2.
 * Hidden (hide this now to react later for 0 Energy) isn't wired up yet — see
 * docs/data-sourcing.md; this covers the card's baseline effect when played normally from hand.
 */
export const hiddenBlade: SpecialCaseHandler = {
  cardId: "hidden-blade",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    const controller = ctx.game.players[target.controller];
    destroyInstance(ctx.game, getCard, targetInstanceId);
    for (let i = 0; i < DRAW_COUNT; i += 1) {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
