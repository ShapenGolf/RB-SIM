import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHTY_THRESHOLD = 5;

/**
 * [Reaction] As an additional cost to play this, kill a friendly [Mighty] unit (5+ Might). Draw
 * 2 and channel 1 rune exhausted.
 *
 * The mandatory additional cost isn't validated at play time — this engine doesn't reject a play
 * when the mandatory cost can't be paid (see docs/data-sourcing.md, same precedent as
 * heedless-resurrection.ts). Simplification: no player choice of which Mighty unit — kills the
 * one just at the threshold, minimizing the loss.
 */
export const sacrifice: SpecialCaseHandler = {
  cardId: "sacrifice",
  onPlay: (ctx) => {
    let weakestMighty: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      const might = computeMight(ctx.game, getCard, instance, "none");
      if (might < MIGHTY_THRESHOLD) continue;
      if (!weakestMighty || might < computeMight(ctx.game, getCard, weakestMighty, "none")) {
        weakestMighty = instance;
      }
    }
    if (weakestMighty) destroyInstance(ctx.game, getCard, weakestMighty.instanceId);

    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
    const rune = player.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      player.runePool.push(rune);
    }
  },
};
