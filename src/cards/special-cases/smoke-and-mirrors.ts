import { getCard } from "../db";
import { moveInstanceToBase, moveInstanceToBattlefield } from "./move-helpers";
import type { CardInstance, GameState } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] [Action] Choose a unit you control and another unit you control at a different
 * location. If at least one of them has [Temporary], move each to the other's location. Draw 1.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: no player choice of which units —
 * picks a friendly unit with [Temporary] and another friendly unit at a different location.
 */
export const smokeAndMirrors: SpecialCaseHandler = {
  cardId: "smoke-and-mirrors",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const temporaryUnit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== controller || !i.statuses.temporary) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!temporaryUnit) return;
    const other = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== controller || i.instanceId === temporaryUnit.instanceId) return false;
      const t = getCard(i.cardId).type;
      if (t !== "unit" && t !== "champion") return false;
      return !(
        i.zone === temporaryUnit.zone &&
        i.battlefieldIndex === temporaryUnit.battlefieldIndex
      );
    });
    if (!other) return;

    swapLocations(ctx.game, temporaryUnit, other);

    const player = ctx.game.players[controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};

function swapLocations(game: GameState, a: CardInstance, b: CardInstance): void {
  const aZone = a.zone;
  const aIndex = a.battlefieldIndex;
  const bZone = b.zone;
  const bIndex = b.battlefieldIndex;

  if (bZone === "battlefield" && bIndex !== null) {
    moveInstanceToBattlefield(game, a.instanceId, bIndex);
  } else {
    moveInstanceToBase(game, getCard, a.instanceId);
  }

  if (aZone === "battlefield" && aIndex !== null) {
    moveInstanceToBattlefield(game, b.instanceId, aIndex);
  } else {
    moveInstanceToBase(game, getCard, b.instanceId);
  }
}
