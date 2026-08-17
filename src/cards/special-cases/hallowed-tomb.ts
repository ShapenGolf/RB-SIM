import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * When you hold here, you may return your Chosen Champion from your trash to your Champion Zone
 * if it is empty.
 *
 * "You may" auto-resolves (always returns it if legal) — there's no real reason to decline a
 * free zone refill. Matches on name, not the original cardId: every copy of the Chosen Champion's
 * name counts as the Chosen Champion during play, not just the physical card that started in the
 * zone (see docs/deck-building-rules.md).
 */
export const hallowedTomb: SpecialCaseHandler = {
  cardId: "hallowed-tomb",
  onBeginningWhileHeld: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.championZone !== null || !player.chosenChampionId) return;
    const championName = getCard(player.chosenChampionId).name;
    const trashIndex = player.trash.findIndex((cardId) => getCard(cardId).name === championName);
    if (trashIndex === -1) return;
    const [returned] = player.trash.splice(trashIndex, 1);
    player.championZone = returned;
  },
};
