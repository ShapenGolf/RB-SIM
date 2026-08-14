import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playTokenToBase } from "./token-helpers";

/** Play a 2 Might Sand Soldier unit token for each Equipment you control. Then ready two of them. */
export const arise: SpecialCaseHandler = {
  cardId: "arise",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const equipmentCount = Object.values(ctx.game.instances).filter(
      (i) => i.controller === controller && Boolean(getCard(i.cardId).equipCost),
    ).length;
    const tokens = [];
    for (let i = 0; i < equipmentCount; i += 1) {
      tokens.push(playTokenToBase(ctx.game, "token-sand-soldier-2", controller));
    }
    for (const token of tokens.slice(0, 2)) token.exhausted = false;
  },
};
