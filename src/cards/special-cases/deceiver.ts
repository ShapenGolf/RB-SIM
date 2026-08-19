import { getCard } from "../db";
import { createInstance } from "../../game/setup";
import { SpecialCaseEngine } from "./registry";
import type { GameState, PlayerId } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DISCARD_COUNT = 1;

/**
 * When you conquer or hold, you may discard 1 and exhaust me to play a ready Reflection unit
 * token there. It becomes a copy of another unit there. Give it [Temporary].
 *
 * Simplification: same approach as mirror-image.ts — rather than a blank "Reflection" token that
 * transforms, this directly creates a fresh instance of the target's own card (matching name/
 * Might/keywords/abilities exactly, the practical meaning of "a copy"); it doesn't carry over the
 * original's accumulated damage, buffs, or attached Equipment. No player choice of which unit to
 * copy (see docs/data-sourcing.md) — picks the first friendly unit found at that battlefield.
 * onConquer/onHold both already fire on the Legend pseudo-instance with battlefieldIndex set to
 * the relevant Battlefield (see game/combat.ts conquerBattlefield/resolveHoldTriggers), which is
 * what makes this reachable at all. "Exhaust me" uses PendingOptionalCost.cost.exhaustLegend
 * (game/state.ts) since a Legend isn't a real game.instances entry.
 */
export const deceiver: SpecialCaseHandler = {
  cardId: "deceiver",
  onConquer: (ctx) => offer(ctx.game, ctx.instance.controller, ctx.instance.battlefieldIndex),
  onHold: (ctx) => offer(ctx.game, ctx.instance.controller, ctx.instance.battlefieldIndex),
  onOptionalCostPaid: (game, playerId, payload) => {
    if (!payload) return;
    const battlefieldIndex = Number(payload);
    const slot = game.battlefields[battlefieldIndex];
    if (!slot) return;
    const toCopy = slot.units[playerId]
      .map((id) => game.instances[id])
      .find((instance) => {
        if (!instance) return false;
        const t = getCard(instance.cardId).type;
        return t === "unit" || t === "champion";
      });
    if (!toCopy) return;
    const token = createInstance(game, toCopy.cardId, playerId);
    token.exhausted = false;
    token.zone = "battlefield";
    token.battlefieldIndex = battlefieldIndex;
    token.statuses.temporary = true;
    slot.units[playerId].push(token.instanceId);
  },
};

function offer(game: GameState, controller: PlayerId, battlefieldIndex: number | null): void {
  if (battlefieldIndex === null) return;
  if (game.pendingOptionalCost) return;
  const legend = game.players[controller].legend;
  if (!legend || legend.exhausted) return;
  SpecialCaseEngine.offerOptionalCost(
    game,
    controller,
    "deceiver",
    { energy: 0, exhaustLegend: true, discardCount: DISCARD_COUNT },
    String(battlefieldIndex),
  );
}
