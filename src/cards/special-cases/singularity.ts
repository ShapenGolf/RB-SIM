import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * Deal 6 to each of up to two units.
 *
 * Simplification: the play-target picker only supports a single target per play (see
 * docs/data-sourcing.md), so this deals 6 to just the one chosen target — a legal (if
 * conservative) real play of the card, since "up to two" already allows hitting only one.
 */
export const singularity: SpecialCaseHandler = {
  cardId: "singularity",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    if (!ctx.game.instances[targetInstanceId]) return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, 6, ctx.instance.controller);
  },
};
