import type { SpecialCaseHandler } from "./types";

const DRAW = 2;

/** Choose a friendly unit without [Temporary]. Give it [Temporary]. Draw 2. */
export const shadowsCall: SpecialCaseHandler = {
  cardId: "shadows-call",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller || target.statuses.temporary) return;
    target.statuses.temporary = true;

    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < DRAW; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
