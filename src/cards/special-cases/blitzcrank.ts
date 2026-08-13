import type { SpecialCaseHandler } from "./types";

/**
 * [Tank] When you play me to a battlefield, you may move an enemy unit to here.
 * When I hold, return me to my owner's hand.
 *
 * "Play me to a battlefield" only happens via the ambushBattlefieldIndex play option
 * (see moves.ts playCard) — champions may always choose a Battlefield destination there,
 * approximating the real Champion Zone rules this engine doesn't otherwise model (see
 * docs/rules-reference.md). If Blitzcrank is instead played to base normally, the target
 * prompt (needsPlayTarget) still appears but is a no-op — click Abbrechen/skip.
 */
export const blitzcrank: SpecialCaseHandler = {
  cardId: "blitzcrank",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;

    if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
      const oldSlot = ctx.game.battlefields[target.battlefieldIndex];
      oldSlot.units[target.controller] = oldSlot.units[target.controller].filter((id) => id !== targetInstanceId);
    } else if (target.zone === "base") {
      const owner = ctx.game.players[target.controller];
      owner.base = owner.base.filter((id) => id !== targetInstanceId);
    } else {
      return;
    }

    target.zone = "battlefield";
    target.battlefieldIndex = ctx.instance.battlefieldIndex;
    ctx.game.battlefields[ctx.instance.battlefieldIndex].units[target.controller].push(targetInstanceId);
  },
  onHold: (ctx) => {
    if (ctx.instance.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
      slot.units[ctx.instance.controller] = slot.units[ctx.instance.controller].filter(
        (id) => id !== ctx.instance.instanceId,
      );
    }
    delete ctx.game.instances[ctx.instance.instanceId];
    ctx.game.players[ctx.instance.controller].hand.push(ctx.instance.cardId);
  },
};
