import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import type { SpecialCaseHandler } from "./types";

const REVEAL_COUNT = 2;

/**
 * When you conquer, you may exhaust me to reveal the top 2 cards of your Main Deck. You may
 * banish one, then play it. Recycle the rest.
 *
 * Simplification: no interactive Energy/Rune payment for the revealed card (this engine has no
 * partial-cost-payment flow for a reveal-and-play effect — see docs/data-sourcing.md), so the
 * higher-cost revealed card is played via playCardIgnoringCost as the closest approximation;
 * always exhausts to reveal if not already exhausted (no real downside).
 */
export const voidBurrower: SpecialCaseHandler = {
  cardId: "void-burrower",
  onConquer: (ctx) => {
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (!legend || legend.exhausted) return;
    legend.exhausted = true;

    const player = ctx.game.players[ctx.instance.controller];
    const revealed = Array.from({ length: REVEAL_COUNT }, () => player.mainDeck.shift()).filter(
      (id): id is string => Boolean(id),
    );
    if (revealed.length === 0) return;
    const playableIdx = revealed
      .map((id, i) => ({ id, i, cost: getCard(id).energyCost ?? 0, type: getCard(id).type }))
      .filter((r) => r.type !== "rune" && r.type !== "legend" && r.type !== "battlefield")
      .sort((a, b) => b.cost - a.cost)[0]?.i;

    if (playableIdx === undefined) {
      player.mainDeck.push(...revealed);
      return;
    }
    const played = revealed[playableIdx];
    const rest = revealed.filter((_, i) => i !== playableIdx);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, played);
    player.mainDeck.push(...rest);
  },
};
