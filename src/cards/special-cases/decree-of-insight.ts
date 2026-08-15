import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const MIGHT_PENALTY = 5;

/**
 * [Reaction] Ignore [Deflect] while paying this spell's cost. Give an enemy Body (Body Rune)
 * unit -5 Might this turn.
 *
 * "Ignore Deflect" is moot — Deflect's extraTargetingCost hook isn't enforced anywhere in the
 * engine, for any card (see spirits-refuge.ts's identical note). Reaction timing isn't modeled.
 * Simplification: no player choice of which enemy Body unit (see docs/data-sourcing.md) — picks
 * the first one found.
 */
export const decreeOfInsight: SpecialCaseHandler = {
  cardId: "decree-of-insight",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const card = getCard(i.cardId);
      return (card.type === "unit" || card.type === "champion") && card.domains.includes("Body");
    });
    if (!target) return;
    target.tempMightBonus -= MIGHT_PENALTY;
  },
};
