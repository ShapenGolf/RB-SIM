import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/** Kill all units. */
export const theRuination: SpecialCaseHandler = {
  cardId: "the-ruination",
  onPlay: (ctx) => {
    const toKill = Object.values(ctx.game.instances)
      .filter((i) => {
        const type = getCard(i.cardId).type;
        return type === "unit" || type === "champion";
      })
      .map((i) => i.instanceId);
    for (const id of toKill) {
      if (ctx.game.instances[id]) destroyInstance(ctx.game, getCard, id);
    }
  },
};
