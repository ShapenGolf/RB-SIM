import type { Card } from "../types";
import type { GameState } from "../../game/state";
import { SpecialCaseEngine } from "./registry";

/**
 * Moves `instanceId` to its controller's base from wherever it currently is (base is a no-op).
 * Shared by every "move a unit to its base" effect (Fight or Flight, Amateur Recital, ...).
 * Returns false (no-op) if the instance doesn't exist, is already in base, or something in play
 * blocks the move (Determined Sentry, Minotaur Reckoner, Vilemaw's Lair).
 */
export function moveInstanceToBase(game: GameState, getCard: (id: string) => Card, instanceId: string): boolean {
  const instance = game.instances[instanceId];
  if (!instance || instance.zone === "base") return false;
  if (SpecialCaseEngine.preventsMoveToBase(game, getCard, instance)) return false;
  if (SpecialCaseEngine.blocksMoveToBaseFromBattlefield(game, getCard, instance)) return false;

  if (instance.zone === "battlefield" && instance.battlefieldIndex !== null) {
    const slot = game.battlefields[instance.battlefieldIndex];
    slot.units[instance.controller] = slot.units[instance.controller].filter((id) => id !== instanceId);
  }
  instance.zone = "base";
  instance.battlefieldIndex = null;
  game.players[instance.controller].base.push(instanceId);
  return true;
}
