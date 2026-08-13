import type { KeywordHandler } from "../types";

/**
 * Empowered: "While I have the Empowered status, I gain [text]." A card can
 * only become Empowered once per game. The generic engine only tracks the
 * status flag and the once-per-game constraint (see `canBecomeEmpowered`
 * below); the granted text itself is unique per card and belongs in a
 * special-case handler that checks `instance.statuses.empowered`.
 */
export const empoweredHandler: KeywordHandler = {
  name: "empowered",
};

/** True if this instance may still receive the Empowered status this game. */
export function canBecomeEmpowered(instance: { statuses: Record<string, boolean> }): boolean {
  return !instance.statuses.everEmpowered;
}
