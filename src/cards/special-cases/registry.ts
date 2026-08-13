import type { Card } from "../types";
import type { CardInstance, GameState } from "../../game/state";
import type { SpecialCaseContext, SpecialCaseHandler } from "./types";
import { dangerousDuo } from "./dangerous-duo";
import { doomedRecruit } from "./doomed-recruit";
import { stunningBlow } from "./stunning-blow";
import { empoweredChampionBonus } from "./empowered-champion";
import { tacticalBanner } from "./tactical-banner";
import { ancientRuins } from "./ancient-ruins";

const handlers: SpecialCaseHandler[] = [
  dangerousDuo,
  doomedRecruit,
  stunningBlow,
  empoweredChampionBonus,
  tacticalBanner,
  ancientRuins,
];

const registry = new Map<string, SpecialCaseHandler>(handlers.map((h) => [h.cardId, h]));

export function getSpecialCaseHandler(card: Card): SpecialCaseHandler | undefined {
  if (!card.specialCaseId) return undefined;
  return registry.get(card.specialCaseId);
}

function ctxFor(game: GameState, card: Card, instance: CardInstance): SpecialCaseContext {
  return { game, card, instance };
}

export const SpecialCaseEngine = {
  onPlay: (game: GameState, card: Card, instance: CardInstance, targetInstanceId?: string) => {
    getSpecialCaseHandler(card)?.onPlay?.(ctxFor(game, card, instance), targetInstanceId);
  },

  onDestroy: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onDestroy?.(ctxFor(game, card, instance));
  },

  onBeginningWhileHeld: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onBeginningWhileHeld?.(ctxFor(game, card, instance));
  },

  staticMightModifier: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.staticMightModifier?.(ctxFor(game, card, instance)) ?? 0,

  /** Sum of attacking-Might bonuses granted to `allyInstance` by every allied Gear/Battlefield special case currently in play. */
  attackingMightBonusFromAllies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    allyInstance: CardInstance,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === allyInstance.instanceId) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.attackingMightBonusForAlly;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), allyInstance);
    }
    return total;
  },
};
