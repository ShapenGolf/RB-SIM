import type { SpecialCaseHandler } from "./types";

/** [Tank] I get +1 Might for each buffed friendly unit at my battlefield. */
export const settKingpin: SpecialCaseHandler = {
  cardId: "sett-kingpin",
  staticMightModifier: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return 0;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const ids = slot.units[ctx.instance.controller] ?? [];
    let count = 0;
    for (const id of ids) {
      if (ctx.game.instances[id]?.statuses.buffed) count += 1;
    }
    return count;
  },
};
