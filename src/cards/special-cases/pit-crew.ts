import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** When you play a gear, ready me. */
export const pitCrew: SpecialCaseHandler = {
  cardId: "pit-crew",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type === "gear") readyInstance(ctx.game, getCard, ctx.instance.instanceId);
  },
};
