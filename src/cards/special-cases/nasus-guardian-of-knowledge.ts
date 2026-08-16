import type { SpecialCaseHandler } from "./types";

/**
 * Once each turn, when an enemy unit here dies, channel 1 rune exhausted.
 *
 * Uses the new onEnemyUnitDied broadcast (registry.ts / game/combat.ts destroyInstance), location-
 * scoped by comparing battlefieldIndex like preventsAllyDeathHere. "Once each turn" reuses the
 * generic ThisTurn statuses-key auto-reset (turnFlow.ts) — see preventNextDeathThisTurn precedent.
 */
export const nasusGuardianOfKnowledge: SpecialCaseHandler = {
  cardId: "nasus-guardian-of-knowledge",
  onEnemyUnitDied: (ctx, diedInstance) => {
    if (ctx.instance.battlefieldIndex === null || ctx.instance.battlefieldIndex !== diedInstance.battlefieldIndex) return;
    if (ctx.instance.statuses.channeledFromEnemyDeathThisTurn) return;
    ctx.instance.statuses.channeledFromEnemyDeathThisTurn = true;
    const player = ctx.game.players[ctx.instance.controller];
    const rune = player.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      player.runePool.push(rune);
    }
  },
};
