import type { Card, Domain } from "../cards/types";
import { cardDatabase, getCard } from "../cards/db";
import type { BattlefieldSlot, CardInstance, GameState, PlayerId, PlayerState, RuneInstance } from "./state";

/**
 * MVP simplification: rather than requiring a hand-built 40-card deck list
 * (no full Set 1 import yet, see docs/data-sourcing.md), decks are built by
 * cycling through every non-rune/legend/battlefield card in the starter set
 * that matches the Legend's domains, repeated up to a target size. Replace
 * with real decklist construction once full card data is available.
 */

const STARTING_HAND_SIZE = 7; // Unconfirmed exact rule; common TCG default, see docs/rules-reference.md open items.
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

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildPlayer(id: PlayerId, domains: Domain[]): PlayerState {
  const mainDeck = shuffle(buildMainDeck(domains));
  const hand = mainDeck.splice(0, STARTING_HAND_SIZE);
  return {
    id,
    mainDeck,
    hand,
    trash: [],
    banishment: [],
    base: [],
    runeDeck: shuffle(buildRuneDeck(domains)),
    runePool: [],
    points: 0,
    playedMainDeckCardThisTurn: false,
    xp: 0,
    pendingPredict: false,
    hasTakenFirstTurn: false,
    discardedCardThisTurn: false,
    cardsPlayedThisTurn: 0,
    nextUnitEntersReady: false,
    nextSpellCostReduction: 0,
    nextSpellBonusDamage: 0,
  };
}

/** Instantiates a Battlefield card onto a shared slot (not player-owned; pregame setup only, not played via `playCard`). */
function buildBattlefieldSlot(cardId: string): BattlefieldSlot {
  return {
    cardId,
    units: { "0": [], "1": [] },
    controller: null,
  };
}

export interface SetupOptions {
  player0Domains: Domain[];
  player1Domains: Domain[];
  battlefieldCardIds: [string, string];
}

export const defaultSetupOptions: SetupOptions = {
  player0Domains: ["Mind", "Fury"],
  player1Domains: ["Mind", "Fury"],
  battlefieldCardIds: ["battlefield-ancient-ruins", "battlefield-ancient-ruins"],
};

export function setupGame(options: SetupOptions = defaultSetupOptions): GameState {
  const players: Record<PlayerId, PlayerState> = {
    "0": buildPlayer("0", options.player0Domains),
    "1": buildPlayer("1", options.player1Domains),
  };

  return {
    players,
    battlefields: options.battlefieldCardIds.map(buildBattlefieldSlot),
    instances: {},
    turnPhase: "main",
    activePlayer: "0",
    winner: null,
    nextInstanceSeq: 0,
    pendingOptionalCost: null,
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
  };
  game.instances[instance.instanceId] = instance;
  return instance;
}

export { getCard };
