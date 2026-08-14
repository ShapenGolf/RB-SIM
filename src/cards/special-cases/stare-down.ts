import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const XP_GAIN = 1;

/**
 * Choose a friendly unit and a battlefield. Move all enemy units at that battlefield with less
 * Might than the chosen unit to their base. Gain 1 XP.
 *
 * Simplification: no separate battlefield-choice UI (see docs/data-sourcing.md) — the chosen
 * unit's own battlefield is used as "that battlefield".
 */
export const stareDown: SpecialCaseHandler = {
  cardId: "stare-down",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const anchor = ctx.game.instances[targetInstanceId];
    if (!anchor || anchor.controller !== ctx.instance.controller) return;
    if (anchor.zone !== "battlefield" || anchor.battlefieldIndex === null) return;
    const threshold = computeMight(ctx.game, getCard, anchor, "none");

    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[anchor.battlefieldIndex];
    const toMove = slot.units[opponentId].filter((id) => {
      const enemy = ctx.game.instances[id];
      return enemy && computeMight(ctx.game, getCard, enemy, "none") < threshold;
    });
    for (const id of toMove) {
      slot.units[opponentId] = slot.units[opponentId].filter((unitId) => unitId !== id);
      const enemy = ctx.game.instances[id];
      enemy.zone = "base";
      enemy.battlefieldIndex = null;
      ctx.game.players[opponentId].base.push(id);
    }

    ctx.game.players[ctx.instance.controller].xp += XP_GAIN;
  },
};
