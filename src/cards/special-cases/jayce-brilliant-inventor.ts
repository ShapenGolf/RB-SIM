import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";
import type { CardInstance, GameState, PlayerId } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * When you play me or the first time you play a non-token gear each turn, you may ready
 * something besides me that's exhausted.
 *
 * "The first time you play a non-token gear each turn" uses a per-instance status
 * (gearReadiedThisTurn, the "ThisTurn" convention auto-reset by turnFlow.ts's runTurnStart —
 * same shape as lucian-merciless.ts's conqueredOnceThisTurn) rather than PlayerState.
 * playedNonTokenGearThisTurn: that flag is already TRUE by the time onAllyCardPlayed fires for
 * the very gear that set it (game/moves.ts resolvePlayedCard sets it before firing the
 * broadcast), so it can't distinguish "this is the 1st gear" from "this is the 5th" — only "has
 * a gear been played at some point this turn," a different question. onAllyCardPlayed firing at
 * all with a gear card only happens for a genuine hand play (tokens never reach it — they're
 * created via token-helpers.ts, not resolvePlayedCard), so no separate "non-token" filter is
 * needed beyond the type check. Simplification: no player choice of what to ready — readies the
 * strongest exhausted friendly unit/champion found.
 */
function readyStrongestOther(game: GameState, controller: PlayerId, excludeInstanceId: string): void {
  let best: CardInstance | undefined;
  for (const instance of Object.values(game.instances)) {
    if (instance.controller !== controller || instance.instanceId === excludeInstanceId) continue;
    if (!instance.exhausted) continue;
    const t = getCard(instance.cardId).type;
    if (t !== "unit" && t !== "champion") continue;
    if (!best || (getCard(instance.cardId).might ?? 0) > (getCard(best.cardId).might ?? 0)) best = instance;
  }
  if (best) readyInstance(game, getCard, best.instanceId);
}

export const jayceBrilliantInventor: SpecialCaseHandler = {
  cardId: "jayce-brilliant-inventor",
  onPlay: (ctx) => {
    readyStrongestOther(ctx.game, ctx.instance.controller, ctx.instance.instanceId);
  },
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "gear") return;
    if (ctx.instance.statuses.gearReadiedThisTurn) return;
    ctx.instance.statuses.gearReadiedThisTurn = true;
    readyStrongestOther(ctx.game, ctx.instance.controller, ctx.instance.instanceId);
  },
};
