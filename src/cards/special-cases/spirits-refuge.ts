import type { SpecialCaseHandler } from "./types";

/**
 * When you play this, buff a friendly unit.
 * Friendly buffed units have [Deflect] if they didn't already.
 *
 * The Deflect-grant half is a no-op: Deflect's `extraTargetingCost` keyword hook exists
 * (keywords/handlers/deflect.ts) but nothing in moves.ts/the UI enforces it yet anywhere in
 * the engine, for any card — so granting it here would have no observable effect regardless.
 * The bracket-import also mis-attributed a printed "deflect" keyword to this Gear itself (see
 * docs/data-sourcing.md's granted-vs-printed-keyword quirk); harmless for the same reason.
 */
export const spiritsRefuge: SpecialCaseHandler = {
  cardId: "spirits-refuge",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.statuses.buffed = true;
  },
};
