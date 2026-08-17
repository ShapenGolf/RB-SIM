import { getCard } from "../db";
import { returnInstanceToHand } from "./bounce-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * You may pay 1 Energy to hide a card with [Hidden] instead of Rune. 1 Energy, Exhaust: Put a
 * Teemo unit you own into your hand from your Champion Zone or the board.
 *
 * The Hidden-cost alternative is moot — [Hidden] itself isn't wired up (see
 * docs/data-sourcing.md). The Champion Zone half is real: checks there first, falls back to
 * searching the board (matches the printed "or the board").
 */
export const swiftScout: SpecialCaseHandler = {
  cardId: "swift-scout",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  onActivate: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.championZone && (getCard(player.championZone).tags ?? []).includes("Teemo")) {
      player.hand.push(player.championZone);
      player.championZone = null;
      return;
    }
    const teemo = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const c = getCard(i.cardId);
      return (c.type === "unit" || c.type === "champion") && (c.tags ?? []).includes("Teemo");
    });
    if (teemo) returnInstanceToHand(ctx.game, teemo.instanceId);
  },
};
