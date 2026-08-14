import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/** At the start of each player's Beginning Phase, deal 1 to each unit here. */
export const frozenFortress: SpecialCaseHandler = {
  cardId: "frozen-fortress",
  onEveryBeginningPhase: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const targetIds = [...slot.units["0"], ...slot.units["1"]];
    for (const id of targetIds) {
      if (!ctx.game.instances[id]) continue;
      dealSpellDamage(ctx.game, getCard, id, 1, ctx.instance.controller);
    }
  },
};
