import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const SHIELD_AMOUNT = 3;

/**
 * [Hidden] Give a unit [Shield 3] and [Tank] this turn.
 *
 * [Hidden]'s face-down/react-later timing isn't modeled (see docs/data-sourcing.md) — this
 * resolves immediately like every other bespoke Hidden/Reaction card. Simplification: no player
 * choice of which unit (see docs/data-sourcing.md) — targets the controller's weakest friendly
 * unit, where the defensive buff matters most.
 */
export const block: SpecialCaseHandler = {
  cardId: "block",
  onPlay: (ctx) => {
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakest || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakest, "none")) {
        weakest = instance;
      }
    }
    if (!weakest) return;
    weakest.grantedThisTurn.push({ keyword: "shield", value: SHIELD_AMOUNT });
    weakest.grantedThisTurn.push({ keyword: "tank" });
  },
};
