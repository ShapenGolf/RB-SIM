import type { GameState } from "../../game/state";

/**
 * Removes `instanceId` from wherever it's sitting (base or a Battlefield) and returns its card
 * to its owner's hand. Shared by every "return to hand" effect (Angler Beast, Downwell, ...).
 * Simplification: doesn't special-case attached Equipment (see game/equip.ts) — an attached
 * gear's owning unit isn't touched, matching the existing Angler Beast precedent.
 */
export function returnInstanceToHand(game: GameState, instanceId: string): void {
  const target = game.instances[instanceId];
  if (!target) return;
  if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
    const slot = game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== instanceId);
  } else {
    const owner = game.players[target.controller];
    owner.base = owner.base.filter((id) => id !== instanceId);
  }
  delete game.instances[instanceId];
  game.players[target.controller].hand.push(target.cardId);
}
