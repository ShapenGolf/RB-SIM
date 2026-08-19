import type { Card, Domain } from "../cards/types";
import { cardDatabase, getCard } from "../cards/db";
import type { DeckList } from "../cards/deckValidation";
import type { BattlefieldSlot, CardInstance, GameState, PlayerId, PlayerState, RuneInstance } from "./state";

/**
 * MVP simplification: rather than requiring a hand-built 40-card deck list
 * (no full Set 1 import yet, see docs/data-sourcing.md), decks are built by
 * cycling through every non-rune/legend/battlefield card in the starter set
 * that matches the Legend's domains, repeated up to a target size. Replace
 * with real decklist construction once full card data is available.
 */

const STARTING_HAND_SIZE = 4; // Confirmed by user 2026-08-15: draw 4, then mulligan up to 2 (see moves.ts `mulligan`).
const MAIN_DECK_SIZE = 40;
const RUNE_DECK_SIZE = 12;

let instanceCounter = 0;
function nextInstanceId(): string {
  instanceCounter += 1;
  return `inst-${instanceCounter}`;
}

function cardsMatchingDomains(domains: Domain[], types: Card["type"][]): Card[] {
  return Object.values(cardDatabase).filter(
    (card) => types.includes(card.type) && card.domains.some((d) => domains.includes(d)),
  );
}

function buildMainDeck(domains: Domain[]): string[] {
  const pool = cardsMatchingDomains(domains, ["unit", "champion", "spell", "gear"]);
  if (pool.length === 0) throw new Error(`No playable cards found for domains: ${domains.join(", ")}`);
  const deck: string[] = [];
  let i = 0;
  while (deck.length < MAIN_DECK_SIZE) {
    deck.push(pool[i % pool.length].id);
    i += 1;
  }
  return deck;
}

function buildRuneDeck(domains: Domain[]): RuneInstance[] {
  const runeCards = Object.values(cardDatabase).filter(
    (card) => card.type === "rune" && card.domains.some((d) => domains.includes(d)),
  );
  if (runeCards.length === 0) throw new Error(`No Rune cards found for domains: ${domains.join(", ")}`);
  const deck: RuneInstance[] = [];
  let i = 0;
  while (deck.length < RUNE_DECK_SIZE) {
    const card = runeCards[i % runeCards.length];
    deck.push({ instanceId: nextInstanceId(), domain: card.domains[0], exhausted: false });
    i += 1;
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Every PlayerState field with a fixed starting value, independent of deck contents. */
function emptyPlayerState(id: PlayerId): Omit<PlayerState, "mainDeck" | "hand" | "runeDeck"> {
  return {
    id,
    championZone: null,
    chosenChampionId: null,
    hiddenZone: [],
    trash: [],
    banishment: [],
    base: [],
    runePool: [],
    legend: null,
    points: 0,
    playedMainDeckCardThisTurn: false,
    xp: 0,
    pendingPredict: 0,
    hasTakenFirstTurn: false,
    discardedCardThisTurn: false,
    chosenEnemyUnitThisTurn: false,
    cardsPlayedThisTurn: 0,
    gainedXPThisTurn: false,
    runesSpentThisTurn: 0,
    chosenEnemyTargetsThisTurn: 0,
    nextUnitEntersReady: false,
    nextUnitBuffed: false,
    nextSpellCostReduction: 0,
    nextCardCostReduction: 0,
    nextSpellBonusDamage: 0,
    unitsEnterReadyThisTurn: false,
    buffUnitsPlayedThisTurn: false,
    enemyUnitDiedThisTurn: false,
    readyRunesAtEndOfTurn: 0,
    turnsTaken: 0,
    friendlyUnitDiedDuringBeginningThisTurn: false,
    playedSpellThisTurn: false,
    playedNonTokenUnitThisTurn: false,
    playedNonTokenGearThisTurn: false,
    maxEnergySpentOnSpellThisTurn: 0,
    mulliganDone: false,
    battlefieldPool: [],
    chosenBattlefieldId: null,
    cantPlaySpellsThisTurn: false,
  };
}

/** Builds a player from a real, validated DeckList (see cards/deckValidation.ts) instead of the domain-cycling MVP fallback. Also used by game/moves.ts's `submitDeck` (online lobby's per-player deck submission, see game/game.ts's "deckSelect" phase). */
export function buildPlayerFromDeckList(id: PlayerId, deck: DeckList): PlayerState {
  // The Chosen Champion starts the game set aside in its own zone, "ready to play" (see
  // docs/deck-building-rules.md) — not shuffled into the Main Deck's draw pile with its
  // other copies (if any), so it never gets stuck undrawn or eats an opening-hand slot.
  const remainingMainDeck = [...deck.mainDeck];
  const championIndex = remainingMainDeck.indexOf(deck.chosenChampionId);
  if (championIndex !== -1) remainingMainDeck.splice(championIndex, 1);

  const mainDeck = shuffle(remainingMainDeck);
  const hand = mainDeck.splice(0, STARTING_HAND_SIZE);
  const runeDeck = shuffle(
    deck.runeDeck.map((cardId) => ({ instanceId: nextInstanceId(), domain: getCard(cardId).domains[0], exhausted: false })),
  );
  return {
    ...emptyPlayerState(id),
    mainDeck,
    hand,
    runeDeck,
    legend: { cardId: deck.legendId, exhausted: false },
    championZone: deck.chosenChampionId,
    chosenChampionId: deck.chosenChampionId,
    battlefieldPool: deck.battlefields,
  };
}

function buildPlayer(id: PlayerId, domains: Domain[]): PlayerState {
  const mainDeck = shuffle(buildMainDeck(domains));
  const hand = mainDeck.splice(0, STARTING_HAND_SIZE);
  return { ...emptyPlayerState(id), mainDeck, hand, runeDeck: shuffle(buildRuneDeck(domains)) };
}

/** Instantiates a Battlefield card onto a shared slot (not player-owned; pregame setup only, not played via `playCard`). */
function buildBattlefieldSlot(cardId: string): BattlefieldSlot {
  return {
    cardId,
    units: { "0": [], "1": [] },
    controller: null,
    chosenHereTriggeredThisTurn: {},
  };
}

export interface SetupOptions {
  player0Domains: Domain[];
  player1Domains: Domain[];
  battlefieldCardIds: [string, string];
  /**
   * Real, validated decks from the deck builder (see cards/deckValidation.ts and ui/DeckBuilder.tsx).
   * When set for a player, it replaces the domain-cycling MVP fallback (`buildPlayer`) for that
   * player; `player{0,1}Domains` is then only used as a fallback/for tests. Legend/Chosen Champion
   * are stored on the DeckList for Domain Identity + future Legend-ability work, but aren't yet
   * given in-game mechanical effect — the engine doesn't model Legend/Champion zones (see
   * game/moves.ts, game/playFree.ts: Legend cards are never playable).
   */
  player0Deck?: DeckList;
  player1Deck?: DeckList;
}

export const defaultSetupOptions: SetupOptions = {
  player0Domains: ["Mind", "Fury"],
  player1Domains: ["Mind", "Fury"],
  battlefieldCardIds: ["battlefield-ancient-ruins", "battlefield-ancient-ruins"],
};

export function setupGame(options: SetupOptions = defaultSetupOptions): GameState {
  const players: Record<PlayerId, PlayerState> = {
    "0": options.player0Deck ? buildPlayerFromDeckList("0", options.player0Deck) : buildPlayer("0", options.player0Domains),
    "1": options.player1Deck ? buildPlayerFromDeckList("1", options.player1Deck) : buildPlayer("1", options.player1Domains),
  };

  // Placeholder battlefields — index 0 is player "0"'s slot, index 1 is player "1"'s. The real
  // Menu-driven flow overwrites both `cardId`s via the `chooseBattlefield` move once each player
  // picks from their own `battlefieldPool` (see game/game.ts's "battlefieldSelect" phase); a
  // player with no real deck-submitted pool (MVP fallback, or direct setupGame() calls in tests)
  // has nothing to choose, so their slot's default here is final — mark it pre-resolved.
  const battlefields = options.battlefieldCardIds.map(buildBattlefieldSlot);
  for (const id of ["0", "1"] as PlayerId[]) {
    if (players[id].battlefieldPool.length === 0) players[id].chosenBattlefieldId = battlefields[Number(id)].cardId;
  }

  return {
    players,
    battlefields,
    instances: {},
    turnPhase: "main",
    activePlayer: "0",
    winner: null,
    nextInstanceSeq: 0,
    pendingOptionalCost: null,
    pendingSpellReaction: null,
    pendingCombatReaction: null,
    pendingDamageAssignment: null,
    extraTurnFor: null,
    anyUnitDiedThisTurn: false,
    pendingDisempowerAtEndOfTurn: [],
    preventAllSpellDamageThisTurn: false,
    anyDamageKillsThisTurn: false,
    lastCombatResult: null,
  };
}

export function createInstance(game: GameState, cardId: string, controller: PlayerId): CardInstance {
  const card = getCard(cardId);
  const instance: CardInstance = {
    instanceId: nextInstanceId(),
    cardId,
    controller,
    zone: "base",
    battlefieldIndex: null,
    damage: 0,
    exhausted: true, // Default entering state; Accelerate is the documented exception. See docs/rules-reference.md.
    // Temporary: printed on many token cards (e.g. Sprite tokens) rather than granted by
    // another card's effect — set eagerly here so both sources behave identically (see
    // turnFlow.ts runBeginning, which kills anything with this status before scoring).
    statuses: card.keywords.some((k) => k.keyword === "temporary") ? { temporary: true } : {},
    xp: 0,
    tempMightBonus: 0,
    grantedThisTurn: [],
    equipment: [],
    attachedTo: null,
    pendingSurviveCombatXP: 0,
    damagePreventionPool: 0,
    damageMultiplier: 1,
    movesThisTurn: 0,
  };
  game.instances[instance.instanceId] = instance;
  return instance;
}

export { getCard };
