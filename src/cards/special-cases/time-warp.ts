import type { SpecialCaseHandler } from "./types";

/** Take a turn after this one. Banish this. */
export const timeWarp: SpecialCaseHandler = {
  cardId: "time-warp",
  onPlay: (ctx) => {
    ctx.game.extraTurnFor = ctx.instance.controller;
  },
  banishSelfOnResolve: () => true,
};
