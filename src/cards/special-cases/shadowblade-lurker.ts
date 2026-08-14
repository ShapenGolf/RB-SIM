import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const REDUCTION_PER_COPY = 2;

/** I cost 2 Energy less for each card with my name in your trash. */
export const shadowbladeLurker: SpecialCaseHandler = {
  cardId: "shadowblade-lurker",
  costReduction: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const count = player.trash.filter((id) => getCard(id).name === ctx.card.name).length;
    return Math.min(count * REDUCTION_PER_COPY, ctx.card.energyCost ?? 0);
  },
};
