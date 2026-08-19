import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** When you play a spell, if you spent 4 Energy or more, ready me. Approximates "spent" with the spell's printed Energy cost (no discount tracking yet). */
export const revnaTheLorekeeper: SpecialCaseHandler = {
  cardId: "revna-the-lorekeeper",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type === "spell" && (playedCard.energyCost ?? 0) >= 4) {
      readyInstance(ctx.game, getCard, ctx.instance.instanceId);
    }
  },
};
