import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] Choose a unit. Kill it the next time it takes damage this turn. [Legion] — Kill it
 * now instead. (Get the effect if you've played another card this turn.)
 *
 * Known gap: the base "kill on next damage" delayed-death interception isn't modeled (see
 * docs/data-sourcing.md, same risk category as Soraka/Wanderer's death-redirect) — only the
 * [Legion] immediate-kill path is implemented, using cardsPlayedThisTurn (already incremented for
 * every prior card this turn, not yet for this one) to detect the condition. Simplification: no
 * player choice of which unit — targets the strongest enemy unit.
 */
export const noxianGuillotine: SpecialCaseHandler = {
  cardId: "noxian-guillotine",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.cardsPlayedThisTurn <= 0) return;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let strongest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!strongest || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, strongest, "none")) {
        strongest = instance;
      }
    }
    if (strongest) destroyInstance(ctx.game, getCard, strongest.instanceId);
  },
};
