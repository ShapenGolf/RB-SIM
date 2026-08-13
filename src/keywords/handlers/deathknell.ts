import type { KeywordHandler } from "../types";

/**
 * Deathknell: triggers when this instance is destroyed, after healing,
 * before the leaves-play zone change. The generic handler only marks that a
 * Deathknell fired (for engine/event-log purposes); the actual unique effect
 * is card text and belongs in a special-case handler that also listens for
 * this event.
 */
export const deathknellHandler: KeywordHandler = {
  name: "deathknell",
  onDestroy: (ctx) => {
    ctx.instance.statuses.deathknellFired = true;
  },
};
