import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Move up to 2 friendly units to base.
 *
 * Simplification: the play-target picker only supports a single target per play (see
 * docs/data-sourcing.md), so this moves just the one chosen unit — a legal (if conservative)
 * real play, since "up to two" already allows moving only one.
 */
export const flash: SpecialCaseHandler = {
  cardId: "flash",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    target.zone = "base";
    target.battlefieldIndex = null;
    ctx.game.players[target.controller].base.push(targetInstanceId);
  },
};
