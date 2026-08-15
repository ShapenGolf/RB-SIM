import type { SpecialCaseHandler, SpecialCaseContext } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";

/**
 * When you play this or at the start of your Beginning Phase, [Burn 1]. When you burn a unit this
 * way, give a friendly unit +Might equal to the burned card's Might this turn.
 * Simplification: auto-picks the controller's strongest ready friendly unit as the recipient — no
 * player choice of which (see docs/data-sourcing.md).
 */
function burnAndBuff(ctx: SpecialCaseContext): void {
  const player = ctx.game.players[ctx.instance.controller];
  const burned = player.mainDeck.shift();
  if (!burned) return;
  player.trash.push(burned);
  const burnedCard = getCard(burned);
  if (burnedCard.type !== "unit" || (burnedCard.might ?? 0) <= 0) return;

  let best: CardInstance | undefined;
  let bestMight = -Infinity;
  for (const instance of Object.values(ctx.game.instances)) {
    if (instance.controller !== ctx.instance.controller) continue;
    const card = getCard(instance.cardId);
    if (card.type !== "unit" && card.type !== "champion") continue;
    if (instance.exhausted) continue;
    const might = computeMight(ctx.game, getCard, instance, "none");
    if (might > bestMight) {
      bestMight = might;
      best = instance;
    }
  }
  if (best) best.tempMightBonus += burnedCard.might ?? 0;
}

export const forgottenRelic: SpecialCaseHandler = {
  cardId: "forgotten-relic",
  onPlay: (ctx) => burnAndBuff(ctx),
  onBeginning: (ctx) => burnAndBuff(ctx),
};
