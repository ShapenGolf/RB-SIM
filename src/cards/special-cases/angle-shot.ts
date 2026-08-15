import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { attachEquipment } from "../../game/equip";

/**
 * [Reaction] Choose a unit and an Equipment with the same controller. Attach that Equipment to
 * that unit or detach that Equipment from that unit. Draw 1.
 *
 * Simplification: no player choice (see docs/data-sourcing.md). Prefers detaching an enemy's
 * already-attached Equipment (the strictly hostile option); falls back to attaching a friendly
 * unattached Equipment to a friendly unit. Reaction timing isn't modeled — resolves immediately
 * like every other bespoke Reaction card (see eclipse.ts, angle-shot's sibling handlers).
 */
export const angleShot: SpecialCaseHandler = {
  cardId: "angle-shot",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const enemyGear = Object.values(ctx.game.instances).find(
      (i) => i.controller === enemyId && getCard(i.cardId).type === "gear" && i.attachedTo,
    );
    if (enemyGear) {
      const wearer = ctx.game.instances[enemyGear.attachedTo!];
      if (wearer) wearer.equipment = wearer.equipment.filter((id) => id !== enemyGear.instanceId);
      enemyGear.attachedTo = null;
    } else {
      const friendlyGear = Object.values(ctx.game.instances).find(
        (i) => i.controller === ctx.instance.controller && getCard(i.cardId).type === "gear" && !i.attachedTo,
      );
      const friendlyUnit = friendlyGear
        ? Object.values(ctx.game.instances).find(
            (i) =>
              i.controller === ctx.instance.controller &&
              (getCard(i.cardId).type === "unit" || getCard(i.cardId).type === "champion"),
          )
        : undefined;
      if (friendlyGear && friendlyUnit) {
        attachEquipment(ctx.game, getCard, friendlyGear.instanceId, friendlyUnit.instanceId);
      }
    }

    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
