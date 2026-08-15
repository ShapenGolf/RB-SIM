import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import type { SpecialCaseHandler } from "./types";

const BURN_AMOUNT = 3;

/**
 * [Empower] 6 EnergyChaos Rune.
 * When I become [Empowered], choose an opponent. They [Burn 3]. Then you may do this: Choose a
 * unit in their trash and play it, ignoring its cost.
 *
 * Simplification: no player choice — always plays a unit from the burned trash if one exists
 * (no real downside, see docs/data-sourcing.md); in this 2-player engine "an opponent" is
 * always the one opponent.
 */
export const kharox: SpecialCaseHandler = {
  cardId: "kharox",
  empowerCost: { energy: 6, runeDomain: "Chaos" },
  onBecomeEmpowered: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const enemy = ctx.game.players[enemyId];
    for (let i = 0; i < BURN_AMOUNT; i += 1) {
      const burned = enemy.mainDeck.shift();
      if (burned) enemy.trash.push(burned);
    }
    const idx = enemy.trash.findIndex((id) => {
      const t = getCard(id).type;
      return t === "unit" || t === "champion";
    });
    if (idx === -1) return;
    const [chosen] = enemy.trash.splice(idx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
