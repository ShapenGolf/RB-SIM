import { getCard } from "../db";
import { KeywordEngine } from "../../keywords/registry";
import { dealSpellDamage } from "../../game/spellDamage";
import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

/**
 * [Hidden] When I defend or I'm played from [Hidden], reveal the top 5 cards of your Main Deck.
 * Deal 1 to an enemy unit here for each card with [Hidden], then recycle them.
 *
 * [Hidden]'s face-down timing isn't modeled — "played from Hidden" is approximated as always
 * true on play. No player choice of which enemy unit — targets the first one found here.
 */
function revealAndDamage(ctx: SpecialCaseContext): void {
  if (ctx.instance.battlefieldIndex === null) return;
  const enemyId = ctx.instance.controller === "0" ? "1" : "0";
  const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
  const targetId = slot.units[enemyId][0];
  if (!targetId) return;

  const player = ctx.game.players[ctx.instance.controller];
  const revealed = player.mainDeck.splice(0, 5);
  const hiddenCount = revealed.filter((id) => KeywordEngine.hasKeyword(getCard(id), "hidden")).length;
  for (const cardId of revealed) player.mainDeck.push(cardId);
  if (hiddenCount > 0) dealSpellDamage(ctx.game, getCard, targetId, hiddenCount, ctx.instance.controller);
}

export const teemoStrategist: SpecialCaseHandler = {
  cardId: "teemo-strategist",
  onPlay: (ctx) => revealAndDamage(ctx),
  onDefend: (ctx) => revealAndDamage(ctx),
};
