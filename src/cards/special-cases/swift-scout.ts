import { getCard } from "../db";
import { returnInstanceToHand } from "./bounce-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * You may pay 1 Energy to hide a card with [Hidden] instead of Rune. 1 Energy, Exhaust: Put a
 * Teemo unit you own into your hand from your Champion Zone or the board.
 *
 * The Hidden-cost alternative is moot — [Hidden] itself isn't wired up (see
 * docs/data-sourcing.md). Champion Zone isn't modeled as a distinct zone — Champions sit on the
 * board like any unit, so this just searches the board.
 */
export const swiftScout: SpecialCaseHandler = {
  cardId: "swift-scout",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  onActivate: (ctx) => {
    const teemo = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const c = getCard(i.cardId);
      return (c.type === "unit" || c.type === "champion") && (c.tags ?? []).includes("Teemo");
    });
    if (teemo) returnInstanceToHand(ctx.game, teemo.instanceId);
  },
};
