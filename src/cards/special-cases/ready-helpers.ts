import type { Card } from "../types";
import type { GameState } from "../../game/state";
import { SpecialCaseEngine } from "./registry";
import { fireTemplatedEffect } from "../../game/templatedEffectEngine";

/**
 * Readies `instanceId` as the result of a card effect (a spell, ability, or another card's
 * triggered effect) — the chokepoint for every "ready a unit/gear" effect in the card pool, so
 * cards reacting to "when [it] becomes ready" or "when you ready a friendly unit" (e.g. Fretful
 * Feline, Pirates Haven) see every readying regardless of which card caused it. Returns false
 * (no-op, no broadcast) if the instance doesn't exist, is already ready (never fires for an
 * instance created already ready, e.g. a fresh token — there's no true->false transition), or an
 * ambient effect (Mageseeker Warden) blocks it.
 *
 * NOT used by game/turnFlow.ts's Awaken step, which readies in bulk via its own path (runAwaken)
 * — that path fires the same onBecameReady/onAllyBecameReady broadcasts directly but skips the
 * preventsReadyByEffect check, since Awaken is normal turn structure, not "spells and abilities".
 */
export function readyInstance(game: GameState, getCard: (id: string) => Card, instanceId: string): boolean {
  const instance = game.instances[instanceId];
  if (!instance || !instance.exhausted) return false;
  if (SpecialCaseEngine.preventsReadyByEffect(game, getCard, instance)) return false;
  instance.exhausted = false;
  const card = getCard(instance.cardId);
  fireTemplatedEffect(game, getCard, card, instance, "onBecameReady");
  SpecialCaseEngine.onBecameReady(game, card, instance);
  SpecialCaseEngine.onAllyBecameReady(game, getCard, instance.controller, instance);
  return true;
}
