import type { Card } from "../cards/types";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { checkBecameMighty } from "./mightTransition";
import type { GameState } from "./state";

/**
 * Attaches `gearInstanceId` to `targetInstanceId`, detaching it from wherever it currently sits
 * first (base, or a different unit it was previously equipped to — Equipment can be re-equipped,
 * "even if it's already attached" per Weaponmaster's reminder text). Cost payment is the
 * caller's responsibility (see moves.ts `equipGear` for the player-initiated path). Fires
 * `onEquip` on the target so cards like Jax, Unrelenting ("When you attach an Equipment to me,
 * you may pay 1 Energy to draw 1") can react.
 */
export function attachEquipment(
  game: GameState,
  getCard: (id: string) => Card,
  gearInstanceId: string,
  targetInstanceId: string,
): void {
  const gear = game.instances[gearInstanceId];
  const target = game.instances[targetInstanceId];
  if (!gear || !target) return;

  if (gear.attachedTo) {
    const previousWearer = game.instances[gear.attachedTo];
    if (previousWearer) previousWearer.equipment = previousWearer.equipment.filter((id) => id !== gearInstanceId);
  } else {
    const owner = game.players[gear.controller];
    owner.base = owner.base.filter((id) => id !== gearInstanceId);
  }

  gear.attachedTo = targetInstanceId;
  target.equipment.push(gearInstanceId);
  SpecialCaseEngine.onEquip(game, getCard(target.cardId), target, gear);
  checkBecameMighty(game, getCard);
}
