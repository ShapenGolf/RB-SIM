import { getCard } from "../db";
import { moveInstanceToBase } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] [Action] Move any number of friendly units at a battlefield to their base.
 *
 * [Hidden]'s face-down/react-later timing isn't modeled — resolves immediately. Simplification:
 * no player choice of which battlefield (see docs/data-sourcing.md) — picks the first
 * battlefield with friendly units and moves all of them to base.
 */
export const emperorsDivide: SpecialCaseHandler = {
  cardId: "emperors-divide",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const slot = ctx.game.battlefields.find((s) => s.units[controller].length > 0);
    if (!slot) return;
    for (const id of [...slot.units[controller]]) {
      moveInstanceToBase(ctx.game, getCard, id);
    }
  },
};
