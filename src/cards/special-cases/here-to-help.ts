import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] (Hide now for Rune to react with later for 0 Energy.)
 * [Action] (Play on your turn or in showdowns.)
 * You may play a unit from hand to a battlefield you control, reducing its cost by 3 Energy.
 *
 * [Hidden]'s face-down timing and [Action] timing aren't modeled — resolves instantly like a
 * normal spell. The partial "-3 Energy" discount is approximated as playing the unit ignoring
 * its cost entirely (established simplification for trigger-driven plays, see wild-claw.ts). No
 * player choice of which unit (plays the first one in hand) or which controlled battlefield
 * (the first one found) — see docs/data-sourcing.md.
 */
export const hereToHelp: SpecialCaseHandler = {
  cardId: "here-to-help",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const battlefieldIndex = ctx.game.battlefields.findIndex((slot) => slot.controller === ctx.instance.controller);
    if (battlefieldIndex === -1) return;
    const handIdx = player.hand.findIndex((id) => {
      const t = getCard(id).type;
      return t === "unit" || t === "champion";
    });
    if (handIdx === -1) return;
    const [cardId] = player.hand.splice(handIdx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, cardId);
    const newInstance = Object.values(ctx.game.instances).find(
      (i) => i.controller === ctx.instance.controller && i.cardId === cardId && i.zone === "base",
    );
    if (newInstance) moveInstanceToBattlefield(ctx.game, newInstance.instanceId, battlefieldIndex);
  },
};
