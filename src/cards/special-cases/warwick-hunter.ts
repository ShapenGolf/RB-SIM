import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/** I enter ready. When I attack, kill all damaged enemy units here. */
export const warwickHunter: SpecialCaseHandler = {
  cardId: "warwick-hunter",
  selfEntersReady: () => true,
  onAttack: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const enemyController = ctx.instance.controller === "0" ? "1" : "0";
    const damaged = slot.units[enemyController].filter((id) => (ctx.game.instances[id]?.damage ?? 0) > 0);
    for (const id of damaged) destroyInstance(ctx.game, getCard, id);
  },
};
