import { createInstance } from "../../game/setup";
import type { SpecialCaseHandler } from "./types";

/**
 * Once each turn, if you would play a token unit while I'm at a battlefield, you may play that
 * token and an additional copy of it instead.
 *
 * Simplification: always duplicates when eligible (no real downside — see docs/data-sourcing.md).
 * Creates the duplicate directly (not via the shared token-play helpers) to avoid re-triggering
 * this same broadcast recursively.
 */
export const zileanTimeMage: SpecialCaseHandler = {
  cardId: "zilean-time-mage",
  onAllyTokenPlayed: (ctx, tokenCard, tokenInstance) => {
    if (ctx.instance.zone !== "battlefield") return;
    if (ctx.instance.statuses.duplicatedTokenThisTurn) return;
    ctx.instance.statuses.duplicatedTokenThisTurn = true;

    const duplicate = createInstance(ctx.game, tokenCard.id, ctx.instance.controller);
    duplicate.exhausted = tokenInstance.exhausted;
    if (tokenInstance.zone === "battlefield" && tokenInstance.battlefieldIndex !== null) {
      duplicate.zone = "battlefield";
      duplicate.battlefieldIndex = tokenInstance.battlefieldIndex;
      ctx.game.battlefields[tokenInstance.battlefieldIndex].units[ctx.instance.controller].push(duplicate.instanceId);
    } else {
      ctx.game.players[ctx.instance.controller].base.push(duplicate.instanceId);
    }
  },
};
