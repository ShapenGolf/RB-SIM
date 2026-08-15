import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * I cost 2 Energy less to play from anywhere other than your hand.
 * Kill a unit at a battlefield.
 * Simplification: the "cost 2 Energy less from elsewhere" clause isn't modeled — the engine
 * doesn't track play-source-aware cost reductions, and nothing currently plays this card from
 * outside hand anyway (see docs/data-sourcing.md).
 */
export const dragUnder: SpecialCaseHandler = {
  cardId: "drag-under",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    destroyInstance(ctx.game, getCard, targetInstanceId);
  },
};
