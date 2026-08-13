import type { SpecialCaseHandler } from "./types";

/** When I'm played and when I conquer, buff me. Spend my buff: Give me +4 Might this turn. */
export const settBrawler: SpecialCaseHandler = {
  cardId: "sett-brawler",
  onPlay: (ctx) => {
    ctx.instance.statuses.buffed = true;
  },
  onConquer: (ctx) => {
    ctx.instance.statuses.buffed = true;
  },
  activatedAbilityCost: { energy: 0, exhaustSelf: false, spendBuff: true },
  onActivate: (ctx) => {
    ctx.instance.tempMightBonus += 4;
  },
};
