import type { Card } from "../types";
import type { CardInstance, GameState, PlayerId } from "../../game/state";
import type { SpecialCaseContext, SpecialCaseHandler } from "./types";
import { dangerousDuo } from "./dangerous-duo";
import { doomedRecruit } from "./doomed-recruit";
import { stunningBlow } from "./stunning-blow";
import { empoweredChampionBonus } from "./empowered-champion";
import { tacticalBanner } from "./tactical-banner";
import { ancientRuins } from "./ancient-ruins";
import { cleave } from "./cleave";
import { disintegrate } from "./disintegrate";
import { captainFarron } from "./captain-farron";
import { thermoBeam } from "./thermo-beam";
import { magmaWurm } from "./magma-wurm";
import { adaptatron } from "./adaptatron";
import { dravenShowboat } from "./draven-showboat";
import { wielderOfWater } from "./wielder-of-water";
import { stunAnyUnit } from "./stun-any-unit";
import { ragingSoul } from "./raging-soul";
import { dariusTrifarian } from "./darius-trifarian";
import { caitlynPatrolling } from "./caitlyn-patrolling";
import { wizenedElder } from "./wizened-elder";
import { ravenbloomStudent } from "./ravenbloom-student";
import { pitCrew } from "./pit-crew";
import { luxIlluminated } from "./lux-illuminated";
import { dianaNoLongerHuman } from "./diana-no-longer-human";
import { revnaTheLorekeeper } from "./revna-the-lorekeeper";
import { eclipseHerald } from "./eclipse-herald";
import { brazenBuccaneer } from "./brazen-buccaneer";
import { getExcited } from "./get-excited";

const handlers: SpecialCaseHandler[] = [
  dangerousDuo,
  doomedRecruit,
  stunningBlow,
  empoweredChampionBonus,
  tacticalBanner,
  ancientRuins,
  cleave,
  disintegrate,
  captainFarron,
  thermoBeam,
  magmaWurm,
  adaptatron,
  dravenShowboat,
  wielderOfWater,
  stunAnyUnit,
  ragingSoul,
  dariusTrifarian,
  caitlynPatrolling,
  wizenedElder,
  ravenbloomStudent,
  pitCrew,
  luxIlluminated,
  dianaNoLongerHuman,
  revnaTheLorekeeper,
  eclipseHerald,
  brazenBuccaneer,
  getExcited,
];

const registry = new Map<string, SpecialCaseHandler>(handlers.map((h) => [h.cardId, h]));

export function getSpecialCaseHandler(card: Card): SpecialCaseHandler | undefined {
  if (!card.specialCaseId) return undefined;
  return registry.get(card.specialCaseId);
}

export function specialCaseNeedsPlayTarget(card: Card): boolean {
  return getSpecialCaseHandler(card)?.needsPlayTarget ?? false;
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

  onConquer: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onConquer?.(ctxFor(game, card, instance));
  },

  activatedAbilityCost: (card: Card) => getSpecialCaseHandler(card)?.activatedAbilityCost,

  additionalCostDiscardForReduction: (card: Card) =>
    getSpecialCaseHandler(card)?.additionalCostDiscardForReduction,

  activateNeedsTarget: (card: Card) => getSpecialCaseHandler(card)?.activateNeedsTarget ?? false,

  onActivate: (game: GameState, card: Card, instance: CardInstance, targetInstanceId?: string) => {
    getSpecialCaseHandler(card)?.onActivate?.(ctxFor(game, card, instance), targetInstanceId);
  },

  /** Broadcasts a just-played card to every board instance `player` controls with an `onAllyCardPlayed` hook. */
  onAllyCardPlayed: (
    game: GameState,
    getCard: (id: string) => Card,
    player: PlayerId,
    playedCard: Card,
    playCountThisTurn: number,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== player) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyCardPlayed?.(ctxFor(game, card, instance), playedCard, playCountThisTurn);
    }
  },

  /** Broadcasts a just-stunned enemy unit to every board instance `stunningController` controls with an `onAllyStun` hook. */
  onAllyStun: (
    game: GameState,
    getCard: (id: string) => Card,
    stunningController: PlayerId,
    stunnedInstance: CardInstance,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== stunningController) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyStun?.(ctxFor(game, card, instance), stunnedInstance);
    }
  },

  onBeginningWhileHeld: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onBeginningWhileHeld?.(ctxFor(game, card, instance));
  },

  staticMightModifier: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.staticMightModifier?.(ctxFor(game, card, instance)) ?? 0,

  attackingMightModifier: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.attackingMightModifier?.(ctxFor(game, card, instance)) ?? 0,

  defendingMightModifier: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.defendingMightModifier?.(ctxFor(game, card, instance)) ?? 0,

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

  /** True if any other friendly special-case card tells `newInstance` to enter play ready instead of exhausted. */
  othersEnterReadyFor: (
    game: GameState,
    getCard: (cardId: string) => Card,
    newInstance: CardInstance,
  ): boolean => {
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === newInstance.instanceId) continue;
      if (sourceInstance.controller !== newInstance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      if (handler?.othersEnterReady?.(ctxFor(game, sourceCard, sourceInstance))) return true;
    }
    return false;
  },
};
