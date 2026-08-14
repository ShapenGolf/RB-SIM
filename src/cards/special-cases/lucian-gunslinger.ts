import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { KeywordEngine } from "../../keywords/registry";
import { dealSpellDamage } from "../../game/spellDamage";

/** [Assault] When I attack, deal damage equal to my [Assault] to an enemy unit here. */
export const lucianGunslinger: SpecialCaseHandler = {
  cardId: "lucian-gunslinger",
  onAttack: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const enemyId = slot.units[opponentId][0];
    if (!enemyId) return;
    const assault = KeywordEngine.keywordValue(ctx.card, "assault") ?? 1;
    dealSpellDamage(ctx.game, getCard, enemyId, assault, ctx.instance.controller);
  },
};
