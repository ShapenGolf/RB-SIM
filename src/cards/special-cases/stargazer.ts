import type { SpecialCaseHandler } from "./types";

/**
 * Spells with [Flow] you play from your trash cost 2 Energy less, to a minimum of 1 Energy.
 *
 * Moot — "play from your trash" has no dedicated move in this engine's surface (only reactive,
 * trigger-offered plays exist, e.g. immortal-phoenix.ts's onTrashKillWithSpell pattern — see
 * undying-legion.ts's identical note on the missing playFromTrash move). No fallback mode.
 */
export const stargazer: SpecialCaseHandler = {
  cardId: "stargazer",
};
