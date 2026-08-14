import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

const RUNE_THRESHOLD = 4;
const DAMAGE = 2;

/** [Accelerate] When I attack, if you control 4 or fewer runes, deal 2 to all enemy units here. */
export const renektonRageFueled: SpecialCaseHandler = {
  cardId: "renekton-rage-fueled",
  onAttack: (ctx) => {
    if (ctx.game.players[ctx.instance.controller].runePool.length > RUNE_THRESHOLD) return;
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    for (const enemyId of [...slot.units[opponentId]]) {
      dealSpellDamage(ctx.game, getCard, enemyId, DAMAGE, ctx.instance.controller);
    }
  },
};
