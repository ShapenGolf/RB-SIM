import type { SpecialCaseHandler, SpecialCaseContext } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

function isOneOnOne(ctx: SpecialCaseContext): boolean {
  if (ctx.instance.battlefieldIndex === null) return false;
  const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
  const opponentId = ctx.instance.controller === "0" ? "1" : "0";
  return slot.units[ctx.instance.controller].length === 1 && slot.units[opponentId].length === 1;
}

/** When I attack or defend one on one, double my Might this combat. */
export const fioraPeerless: SpecialCaseHandler = {
  cardId: "fiora-peerless",
  onAttack: (ctx) => {
    if (!isOneOnOne(ctx)) return;
    ctx.instance.tempMightBonus += computeMight(ctx.game, getCard, ctx.instance, "none");
  },
  onDefend: (ctx) => {
    if (!isOneOnOne(ctx)) return;
    ctx.instance.tempMightBonus += computeMight(ctx.game, getCard, ctx.instance, "none");
  },
};
