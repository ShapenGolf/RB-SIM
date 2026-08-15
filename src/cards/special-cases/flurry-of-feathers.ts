import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

const TOKEN_COUNT = 4;

/**
 * [Reaction] Choose one — Counter a spell. / Play four 1 Might Bird unit tokens with [Deflect].
 *
 * Counter isn't wired up (deferred — see docs/data-sourcing.md), so this always resolves the
 * token mode. Reaction timing isn't modeled — resolves immediately.
 */
export const flurryOfFeathers: SpecialCaseHandler = {
  cardId: "flurry-of-feathers",
  onPlay: (ctx) => {
    for (let i = 0; i < TOKEN_COUNT; i += 1) {
      playTokenToBase(ctx.game, "token-bird-deflect", ctx.instance.controller);
    }
  },
};
