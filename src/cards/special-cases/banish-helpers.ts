import type { GameState, CardInstance } from "../../game/state";

/**
 * Removes `instance` from wherever it's sitting (base or a Battlefield) and its cardId to its
 * owner's Banishment zone (public, separate from the trash — see docs/rules-reference.md). Shared
 * by every "banish" effect (Ravenbloom Prefect, Wind and Ghosts, ...). Simplification: doesn't
 * special-case attached Equipment, matching the returnInstanceToHand precedent.
 */
export function banishInstance(game: GameState, instance: CardInstance): void {
  if (instance.zone === "battlefield" && instance.battlefieldIndex !== null) {
    const slot = game.battlefields[instance.battlefieldIndex];
    slot.units[instance.controller] = slot.units[instance.controller].filter((id) => id !== instance.instanceId);
  } else {
    const owner = game.players[instance.controller];
    owner.base = owner.base.filter((id) => id !== instance.instanceId);
  }
  delete game.instances[instance.instanceId];
  game.players[instance.controller].banishment.push(instance.cardId);
}
