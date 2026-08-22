import type { GameState, PlayerId, RuneInstance } from "./state";
import { REDACTED_CARD_ID } from "../cards/db";

function redactCardIds(cardIds: string[]): string[] {
  return cardIds.map(() => REDACTED_CARD_ID);
}

function redactRuneOrder(runes: RuneInstance[]): RuneInstance[] {
  // Domain (and even instanceId) order in an undrawn Rune Deck is exactly as secret as Main Deck
  // order — nothing in the UI reads an opponent's runeDeck today (only the face-up runePool is
  // shown), but redact it anyway rather than relying on that staying true.
  return runes.map((r, i) => ({ instanceId: `redacted-${i}`, domain: r.domain, exhausted: r.exhausted }));
}

/**
 * Server-side state redaction for boardgame.io's Socket.IO transport (see ui/OnlineGame.tsx) —
 * without this, the FULL GameState, including the opponent's exact hand, Main Deck order, Rune
 * Deck order, and hidden-card identities, is sent over the network to both clients. ui/Board.tsx's
 * UI never reads those fields for the opponent (only `.length`, to show a count of face-down card
 * backs) — but "the UI doesn't show it" and "the client never receives it" are different
 * guarantees, and only the second one actually matters once someone can read browser
 * devtools/network traffic. Local hotseat play (see ui/client.ts) renders two separate `Client`
 * instances, each bound to a real, non-null `playerID` ("0" or "1") — never a null/spectator
 * view — so this never redacts the CURRENT viewer's own zones, only whichever player they aren't.
 *
 * `battlefieldPool` (the 3 Battlefields a player's DeckList submitted, only 1 of which becomes
 * public once chosen — see `chosenBattlefieldId`) is redacted for the same reason: it previews
 * deck-building choices the opponent hasn't committed to yet.
 *
 * Deliberately NOT redacted: `trash`/`banishment` (public zones — see ui/Board.tsx's opponent-trash
 * panel), `base`/battlefield unit `instances` (face-up, in play), `runePool` (face-up once
 * Channeled), `legend`/`championZone`/`chosenChampionId` (public per deck-building rules).
 *
 * This applies to `Local()` matches too, not just a real Socket.IO connection: every boardgame.io
 * `Client` — including local hotseat's and a `Local({ bots })` match's human seat — applies moves
 * OPTIMISTICALLY against its OWN local copy of G for instant UI feedback, and that local copy is
 * built from exactly this filtered view. A move's own logic that legitimately inspects an
 * opponent's private zone as part of ordinary rules bookkeeping (not a UI read) — e.g. moves.ts's
 * hasReactionCardInHand, deciding whether an attack needs to pause for a reaction window — WILL
 * see `REDACTED_CARD_ID` there during that optimistic pass; `cards/db.ts`'s `getCard` treats that
 * id specially (a safe, keyword-less stand-in) instead of throwing, precisely so this doesn't
 * crash the client mid-move. The AUTHORITATIVE execution (server/master-side, always against the
 * true G) is unaffected either way.
 */
export const playerView = ({ G, playerID }: { G: GameState; playerID?: string | null }): GameState => {
  const view: GameState = { ...G, players: { ...G.players } };
  for (const id of Object.keys(G.players) as PlayerId[]) {
    if (id === playerID) continue; // the viewer's own zones stay exactly as they are
    const p = G.players[id];
    view.players[id] = {
      ...p,
      hand: redactCardIds(p.hand),
      mainDeck: redactCardIds(p.mainDeck),
      runeDeck: redactRuneOrder(p.runeDeck),
      hiddenZone: p.hiddenZone.map((h) => ({ ...h, cardId: REDACTED_CARD_ID })),
      battlefieldPool: redactCardIds(p.battlefieldPool),
    };
  }
  return view;
};
