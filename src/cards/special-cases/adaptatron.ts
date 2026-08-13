import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/** When I conquer, you may kill a gear. If you do, buff me. */
export const adaptatron: SpecialCaseHandler = {
  cardId: "adaptatron",
  onConquer: (ctx) => {
    // No interactive choice at this trigger yet (see docs/data-sourcing.md); deterministically
    // sacrifices the controller's own first available Gear, consistent with this game's other
    // "kill a gear for value" cards being self-sacrifices rather than free removal.
    const ownGear = Object.values(ctx.game.instances).find(
      (i) => i.controller === ctx.instance.controller && getCard(i.cardId).type === "gear",
    );
    if (!ownGear) return;
    destroyInstance(ctx.game, getCard, ownGear.instanceId);
    ctx.instance.statuses.buffed = true;
  },
};
