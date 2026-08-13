import type { SpecialCaseHandler } from "./types";

/** Recycle 3 from your trash, 1 Energy, Exhaust: Draw 1. */
export const garbageGrabber: SpecialCaseHandler = {
  cardId: "garbage-grabber",
  activatedAbilityCost: { energy: 1, exhaustSelf: true, recycleFromTrash: 3 },
  onActivate: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
