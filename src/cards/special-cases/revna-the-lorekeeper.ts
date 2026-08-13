import type { SpecialCaseHandler } from "./types";

/** When you play a spell, if you spent 4 Energy or more, ready me. Approximates "spent" with the spell's printed Energy cost (no discount tracking yet). */
export const revnaTheLorekeeper: SpecialCaseHandler = {
  cardId: "revna-the-lorekeeper",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type === "spell" && (playedCard.energyCost ?? 0) >= 4) {
      ctx.instance.exhausted = false;
    }
  },
};
