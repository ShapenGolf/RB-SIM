import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealDistributedDamage } from "../../game/combat";

/** [Deflect 2] When I attack, deal 5 damage split among any number of enemy units here. */
export const volibear: SpecialCaseHandler = {
  cardId: "volibear",
  onAttack: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const enemyController = ctx.instance.controller === "0" ? "1" : "0";
    const enemyIds = slot.units[enemyController];
    dealDistributedDamage(ctx.game, getCard, enemyIds, 5);
  },
};
