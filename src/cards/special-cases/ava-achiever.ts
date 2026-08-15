import { getCard } from "../db";
import { KeywordEngine } from "../../keywords/registry";
import { playCardIgnoringCost } from "../../game/playFree";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When I attack, you may pay Mind Rune to play a card with [Hidden] from your hand here,
 * ignoring its cost.
 *
 * Simplification: the Domain-Rune-only additional cost is never charged (established precedent,
 * see crescent-guardian.ts). [Hidden]'s face-down zone isn't modeled — the card is played face
 * up like a normal card, then moved to this battlefield. No player choice of which Hidden card
 * (see docs/data-sourcing.md) — plays the first one found in hand.
 */
export const avaAchiever: SpecialCaseHandler = {
  cardId: "ava-achiever",
  onAttack: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const battlefieldIndex = ctx.instance.battlefieldIndex;
    const player = ctx.game.players[ctx.instance.controller];
    const handIdx = player.hand.findIndex((id) => KeywordEngine.hasKeyword(getCard(id), "hidden"));
    if (handIdx === -1) return;
    const [cardId] = player.hand.splice(handIdx, 1);
    const card = getCard(cardId);
    if (card.type !== "unit" && card.type !== "champion" && card.type !== "spell" && card.type !== "gear") {
      player.hand.push(cardId);
      return;
    }
    playCardIgnoringCost(ctx.game, ctx.instance.controller, cardId);
    if (card.type === "unit" || card.type === "champion") {
      const newInstance = Object.values(ctx.game.instances).find(
        (i) => i.controller === ctx.instance.controller && i.cardId === cardId && i.zone === "base",
      );
      if (newInstance) moveInstanceToBattlefield(ctx.game, newInstance.instanceId, battlefieldIndex);
    }
  },
};
