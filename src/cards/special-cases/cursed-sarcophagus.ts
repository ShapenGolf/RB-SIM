import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import type { SpecialCaseHandler } from "./types";

/**
 * When you play this, banish all units from your trash. Exhaust: Play a unit banished with this.
 * (You must pay its costs.)
 *
 * Simplification: "banished WITH THIS" isn't tracked per-source (the shared banishment zone has
 * no per-card origin tag — see docs/data-sourcing.md) — the activated ability searches the whole
 * shared banishment pool. Playing "paying its costs" is approximated as ignoring cost, matching
 * the established precedent across this pool (see jayce-man-of-progress.ts's identical note).
 */
export const cursedSarcophagus: SpecialCaseHandler = {
  cardId: "cursed-sarcophagus",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const remaining: string[] = [];
    for (const cardId of player.trash) {
      const t = getCard(cardId).type;
      if (t === "unit" || t === "champion") {
        player.banishment.push(cardId);
      } else {
        remaining.push(cardId);
      }
    }
    player.trash = remaining;
  },
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const idx = player.banishment.findIndex((id) => {
      const t = getCard(id).type;
      return t === "unit" || t === "champion";
    });
    if (idx === -1) return;
    const [chosen] = player.banishment.splice(idx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
