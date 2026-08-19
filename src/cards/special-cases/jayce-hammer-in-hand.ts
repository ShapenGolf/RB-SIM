import type { SpecialCaseHandler } from "./types";

const ASSAULT_VALUE = 2;

/**
 * When I become ready, choose one to give me this turn — [Assault 2] / [Deflect 2] / [Ganking].
 *
 * Simplification: no player choice of mode (see docs/data-sourcing.md, same precedent as
 * minah-swiftfoot.ts) — always grants Assault 2. Deflect enforcement isn't implemented in this
 * engine at all (see docs/data-sourcing.md), so it would be a no-op grant; Ganking only matters
 * if there's somewhere else to Gank to, while Assault is unconditionally useful the moment Jayce
 * attacks.
 */
export const jayceHammerInHand: SpecialCaseHandler = {
  cardId: "jayce-hammer-in-hand",
  onBecameReady: (ctx) => {
    ctx.instance.grantedThisTurn.push({ keyword: "assault", value: ASSAULT_VALUE });
  },
};
