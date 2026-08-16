import type { GameState } from "../../game/state";
import { getCard } from "../db";
import { battlefieldPseudoInstance } from "../../game/pseudoInstance";
import { SpecialCaseEngine } from "./registry";

/**
 * Removes `instanceId` from wherever it's sitting (base or a Battlefield) and returns its card
 * to its owner's hand. Shared by every "return to hand" effect (Angler Beast, Downwell, ...).
 * Simplification: doesn't special-case attached Equipment (see game/equip.ts) — an attached
 * gear's owning unit isn't touched, matching the existing Angler Beast precedent. If it was at a
 * Battlefield, broadcasts to that Battlefield's own card via onUnitReturnedToHandHere (e.g.
 * Ripper's Bay) — same import-cycle pattern as move-helpers.ts's SpecialCaseEngine import.
 */
export function returnInstanceToHand(game: GameState, instanceId: string): void {
  const target = game.instances[instanceId];
  if (!target) return;
  const fromBattlefieldIndex = target.zone === "battlefield" ? target.battlefieldIndex : null;
  if (fromBattlefieldIndex !== null) {
    const slot = game.battlefields[fromBattlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== instanceId);
  } else {
    const owner = game.players[target.controller];
    owner.base = owner.base.filter((id) => id !== instanceId);
  }
  delete game.instances[instanceId];
  game.players[target.controller].hand.push(target.cardId);
  if (fromBattlefieldIndex !== null) {
    const slot = game.battlefields[fromBattlefieldIndex];
    const battlefieldCard = getCard(slot.cardId);
    if (battlefieldCard.specialCaseId) {
      SpecialCaseEngine.onUnitReturnedToHandHere(
        game,
        battlefieldCard,
        battlefieldPseudoInstance(slot.cardId, target.controller, fromBattlefieldIndex),
        target,
      );
    }
  }
}
