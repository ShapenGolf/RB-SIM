import type { SpecialCaseHandler, SpecialCaseContext } from "./types";

/** At the start of your Beginning Phase, if you control a facedown card at a battlefield, draw 1. */
function drawIfHidingAtABattlefield(ctx: SpecialCaseContext): void {
  const player = ctx.game.players[ctx.instance.controller];
  // Every entry in hiddenZone is already guaranteed to be at a battlefield this player still
  // controls — combat.ts's conquerBattlefield discards a hidden card to trash the instant control
  // of its bound battlefield changes (rule 323.7/461.5.c) — so simply having any entry here IS
  // "control a facedown card at a battlefield" per this card's text.
  if (player.hiddenZone.length === 0) return;
  const card = player.mainDeck.shift();
  if (card) player.hand.push(card);
}

export const mushroomPouch: SpecialCaseHandler = {
  cardId: "mushroom-pouch",
  onBeginning: (ctx) => drawIfHidingAtABattlefield(ctx),
};
