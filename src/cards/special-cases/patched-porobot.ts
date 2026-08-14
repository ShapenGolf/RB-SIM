import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const GEAR_THRESHOLD = 3;

/** (I enter exhausted — already the default entering state, see game/setup.ts createInstance.) When you play me, if you control 3 or more other gear, draw 1. */
export const patchedPorobot: SpecialCaseHandler = {
  cardId: "patched-porobot",
  onPlay: (ctx) => {
    const otherGearCount = Object.values(ctx.game.instances).filter(
      (i) => i.controller === ctx.instance.controller && i.instanceId !== ctx.instance.instanceId && getCard(i.cardId).type === "gear",
    ).length;
    if (otherGearCount < GEAR_THRESHOLD) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
