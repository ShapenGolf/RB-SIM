import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** When you play me, if you control a Poro, buff me and draw 1. */
export const poroHerder: SpecialCaseHandler = {
  cardId: "poro-herder",
  onPlay: (ctx) => {
    const controlsPoro = Object.values(ctx.game.instances).some(
      (i) => i.controller === ctx.instance.controller && getCard(i.cardId).tags?.includes("Poro"),
    );
    if (!controlsPoro) return;
    ctx.instance.statuses.buffed = true;
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
