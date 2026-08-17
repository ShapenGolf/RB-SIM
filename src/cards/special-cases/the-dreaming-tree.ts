import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/** When a player chooses a friendly unit here with a spell for the first time each turn, they draw 1. */
export const theDreamingTree: SpecialCaseHandler = {
  cardId: "the-dreaming-tree",
  onChosenHere: (ctx, target, chooser, sourceCard) => {
    if (sourceCard.type !== "spell") return;
    if (target.controller !== chooser) return; // must be friendly to the chooser
    const targetCard = getCard(target.cardId);
    if (targetCard.type !== "unit" && targetCard.type !== "champion") return;
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    if (!slot || slot.chosenHereTriggeredThisTurn?.[chooser]) return;
    slot.chosenHereTriggeredThisTurn = { ...slot.chosenHereTriggeredThisTurn, [chooser]: true };
    const player = ctx.game.players[chooser];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
