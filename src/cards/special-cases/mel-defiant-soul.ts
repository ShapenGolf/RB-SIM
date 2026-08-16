import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { banishInstance } from "./banish-helpers";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHT_THRESHOLD = 3;

/**
 * [Empower] — Discard a spell
 * When I become [Empowered], banish an enemy unit at a battlefield with 3 Might or less.
 *
 * "3 Might or less" reads as a targeting restriction on the enemy unit itself. No player choice
 * of which qualifying unit (established precedent) — auto-picks the strongest one.
 */
export const melDefiantSoul: SpecialCaseHandler = {
  cardId: "mel-defiant-soul",
  empowerCost: { energy: 0, discardSpell: true },
  onBecomeEmpowered: (ctx) => {
    let strongest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller === ctx.instance.controller || instance.battlefieldIndex === null) continue;
      const card = getCard(instance.cardId);
      if (card.type !== "unit" && card.type !== "champion") continue;
      const might = computeMight(ctx.game, getCard, instance, "none");
      if (might > MIGHT_THRESHOLD) continue;
      if (!strongest || might > computeMight(ctx.game, getCard, strongest, "none")) strongest = instance;
    }
    if (strongest) banishInstance(ctx.game, strongest);
  },
};
