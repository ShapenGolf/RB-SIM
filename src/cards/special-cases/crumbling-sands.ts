import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell if an opponent has played another spell this turn.
 *
 * `playedSpellThisTurn` is set by resolvePlayedCard once a spell fully resolves — the pending
 * spell itself hasn't resolved yet at counter-check time, so this only reflects spells the caster
 * already finished playing BEFORE the pending one, matching "another spell" correctly.
 */
export const crumblingSands: SpecialCaseHandler = {
  cardId: "crumbling-sands",
  canCounterPending: (ctx, pending) => ctx.game.players[pending.casterId].playedSpellThisTurn,
};
