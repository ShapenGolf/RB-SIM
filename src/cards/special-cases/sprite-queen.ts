import type { SpecialCaseContext, SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/** When you play me or at the start of your Beginning Phase, play a ready 3 Might Sprite unit token with [Temporary] to your base. */
function summonSprite(ctx: SpecialCaseContext): void {
  const token = playTokenToBase(ctx.game, "token-sprite-temporary", ctx.instance.controller);
  token.exhausted = false;
}

export const spriteQueen: SpecialCaseHandler = {
  cardId: "sprite-queen",
  onPlay: (ctx) => {
    // Data quirk: the import pipeline attributed the reminder text's "Temporary" (which
    // describes the TOKENS this card creates, not itself) to Sprite Queen's own printed
    // keywords, so createInstance wrongly marks her statuses.temporary — which would kill her
    // at her own controller's very next Beginning Phase. Same class of bracket-text
    // misattribution bug as Laurent Bladekeeper's missing Ganking brackets; cleared here since
    // Sprite Queen has no Temporary text of her own.
    ctx.instance.statuses.temporary = false;
    summonSprite(ctx);
  },
  onBeginning: (ctx) => summonSprite(ctx),
};
