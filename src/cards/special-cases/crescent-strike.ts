import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

const MAIN_DAMAGE = 4;
const SPLASH_DAMAGE = 1;

/** [Action] Choose a battlefield and an enemy unit there. Deal 4 to that unit and 1 to each other enemy unit there. */
export const crescentStrike: SpecialCaseHandler = {
  cardId: "crescent-strike",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    const others = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    dealSpellDamage(ctx.game, getCard, targetInstanceId, MAIN_DAMAGE, ctx.instance.controller);
    for (const id of others) {
      dealSpellDamage(ctx.game, getCard, id, SPLASH_DAMAGE, ctx.instance.controller);
    }
  },
};
