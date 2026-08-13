import type { Card, Domain } from "../types";
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
import { noxusHopeful } from "./noxus-hopeful";
import { skySplitter } from "./sky-splitter";
import { scrapyardChampion } from "./scrapyard-champion";
import { sunDisc } from "./sun-disc";
import { blindFury } from "./blind-fury";
import { brynhirThundersong } from "./brynhir-thundersong";
import { fallingStar } from "./falling-star";
import { ragingFirebrand } from "./raging-firebrand";
import { tryndamere } from "./tryndamere";
import { viDestructive } from "./vi-destructive";
import { immortalPhoenix } from "./immortal-phoenix";
import { kadregrin } from "./kadregrin";
import { volibear } from "./volibear";
import { charm } from "./charm";
import { enGarde } from "./en-garde";
import { findYourCenter } from "./find-your-center";
import { maskOfForesight } from "./mask-of-foresight";
import { poroHerder } from "./poro-herder";
import { spiritsRefuge } from "./spirits-refuge";
import { ravenbornTome } from "./ravenborn-tome";
import { blitzcrank } from "./blitzcrank";
import { lastStand } from "./last-stand";
import { solariShrine } from "./solari-shrine";
import { sona } from "./sona";
import { taric } from "./taric";
import { tastyFaefolk } from "./tasty-faefolk";
import { watchfulSentry } from "./watchful-sentry";
import { leeSin } from "./lee-sin";
import { yasuo } from "./yasuo";
import { leona } from "./leona";
import { eagerApprentice } from "./eager-apprentice";
import { garbageGrabber } from "./garbage-grabber";
import { gemcraftSeer } from "./gemcraft-seer";

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
  noxusHopeful,
  skySplitter,
  scrapyardChampion,
  sunDisc,
  blindFury,
  brynhirThundersong,
  fallingStar,
  ragingFirebrand,
  tryndamere,
  viDestructive,
  immortalPhoenix,
  kadregrin,
  volibear,
  charm,
  enGarde,
  findYourCenter,
  maskOfForesight,
  poroHerder,
  spiritsRefuge,
  ravenbornTome,
  blitzcrank,
  lastStand,
  solariShrine,
  sona,
  taric,
  tastyFaefolk,
  watchfulSentry,
  leeSin,
  yasuo,
  leona,
  eagerApprentice,
  garbageGrabber,
  gemcraftSeer,
];

const registry = new Map<string, SpecialCaseHandler>(handlers.map((h) => [h.cardId, h]));

export function getSpecialCaseHandler(card: Card): SpecialCaseHandler | undefined {
  if (!card.specialCaseId) return undefined;
  return registry.get(card.specialCaseId);
}

export function getSpecialCaseHandlerById(specialCaseId: string): SpecialCaseHandler | undefined {
  return registry.get(specialCaseId);
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

  onConquer: (game: GameState, card: Card, instance: CardInstance, excessDamage: number) => {
    getSpecialCaseHandler(card)?.onConquer?.(ctxFor(game, card, instance), excessDamage);
  },

  onAttack: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onAttack?.(ctxFor(game, card, instance));
  },

  onHold: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onHold?.(ctxFor(game, card, instance));
  },

  onEndOfTurn: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onEndOfTurn?.(ctxFor(game, card, instance));
  },

  activatedAbilityCost: (card: Card) => getSpecialCaseHandler(card)?.activatedAbilityCost,

  additionalCostDiscardForReduction: (card: Card) =>
    getSpecialCaseHandler(card)?.additionalCostDiscardForReduction,

  costReduction: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.costReduction?.(ctxFor(game, card, instance)) ?? 0,

  /** Sum of Energy cost reductions every other special-case card the controller owns grants to the card about to be played. */
  costReductionFromAllies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    playedInstance: CardInstance,
    playedCard: Card,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === playedInstance.instanceId) continue;
      if (sourceInstance.controller !== playedInstance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.costReductionForAlly;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), playedCard);
    }
    return total;
  },

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

  /** Broadcasts a just-killed-by-spell enemy unit to every card in `controller`'s trash with an `onTrashKillWithSpell` hook. */
  onAllyKillWithSpell: (
    game: GameState,
    getCard: (id: string) => Card,
    controller: PlayerId,
    killedInstance: CardInstance,
  ) => {
    for (const cardId of game.players[controller].trash) {
      const card = getCard(cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onTrashKillWithSpell?.(game, controller, cardId, killedInstance);
    }
  },

  /** Offers a "you may pay X to Y" reactive decision to `playerId`, resolved by the `resolveOptionalCost` move. */
  offerOptionalCost: (
    game: GameState,
    playerId: PlayerId,
    specialCaseId: string,
    cost: { energy: number; runeDomain?: Domain },
    payload?: string,
  ) => {
    game.pendingOptionalCost = { playerId, specialCaseId, cost, payload };
  },

  onOptionalCostPaid: (game: GameState, specialCaseId: string, playerId: PlayerId, payload?: string) => {
    getSpecialCaseHandlerById(specialCaseId)?.onOptionalCostPaid?.(game, playerId, payload);
  },

  /** Broadcasts a just-killed enemy unit to every board instance `killingController` controls with an `onAllyKillUnit` hook. */
  onAllyKillUnit: (
    game: GameState,
    getCard: (id: string) => Card,
    killingController: PlayerId,
    killedInstance: CardInstance,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== killingController) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyKillUnit?.(ctxFor(game, card, instance), killedInstance);
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

  /** Same as `attackingMightBonusFromAllies`, but while the ally defends. */
  defendingMightBonusFromAllies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    allyInstance: CardInstance,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === allyInstance.instanceId) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.defendingMightBonusForAlly;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), allyInstance);
    }
    return total;
  },

  /** Conditional self "enters ready" check for the card being played itself. */
  selfEntersReady: (game: GameState, card: Card, instance: CardInstance): boolean =>
    getSpecialCaseHandler(card)?.selfEntersReady?.(ctxFor(game, card, instance)) ?? false,

  /** Sum of static Might modifiers every enemy special-case card's presence applies to `targetInstance`, independent of role. */
  staticMightModifierFromEnemies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    targetInstance: CardInstance,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === targetInstance.instanceId) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.staticMightModifierForEnemy;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), targetInstance);
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
