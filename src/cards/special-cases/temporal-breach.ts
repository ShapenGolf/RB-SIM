import { getCard } from "../db";
import { banishInstance } from "./banish-helpers";
import { playCardIgnoringCost } from "../../game/playFree";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] Banish a unit, then its owner plays it to the same location, ignoring its cost.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: no player choice of which unit —
 * picks the strongest enemy unit at a battlefield.
 */
export const temporalBreach: SpecialCaseHandler = {
  cardId: "temporal-breach",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId || i.zone !== "battlefield") return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!target || target.battlefieldIndex === null) return;

    const owner = target.controller;
    const cardId = target.cardId;
    const battlefieldIndex = target.battlefieldIndex;
    banishInstance(ctx.game, target);
    const player = ctx.game.players[owner];
    const idx = player.banishment.lastIndexOf(cardId);
    if (idx !== -1) player.banishment.splice(idx, 1);
    playCardIgnoringCost(ctx.game, owner, cardId);

    const newInstance = Object.values(ctx.game.instances).find(
      (i) => i.controller === owner && i.cardId === cardId && i.zone === "base",
    );
    if (newInstance) moveInstanceToBattlefield(ctx.game, newInstance.instanceId, battlefieldIndex);
  },
};
