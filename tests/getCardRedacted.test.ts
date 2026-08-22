import { describe, it, expect } from "vitest";
import { getCard, REDACTED_CARD_ID } from "../src/cards/db";
import { attackBattlefield } from "../src/game/moves";
import { playerView } from "../src/game/playerView";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctxArgs(G: GameState, playerID: "0" | "1") {
  return { G, playerID, events: { setActivePlayers: () => {}, endTurn: () => {} } } as unknown as Parameters<typeof attackBattlefield>[0];
}

/**
 * Regression coverage for a crash a real playtest hit: attacking a Battlefield opens a
 * PendingCombatReaction window whenever the DEFENDER has a [Reaction]/[Action] spell in hand (see
 * moves.ts's hasReactionOrActionSpellInHand) — genuine rules logic, not a UI read. boardgame.io
 * applies every move OPTIMISTICALLY against the ACTING client's own local copy of G first, for
 * instant feedback, before the master's authoritative (always-true-G) response reconciles it —
 * and that local copy has been through game/playerView.ts, which redacts the OPPONENT's hand to
 * `REDACTED_CARD_ID` placeholders. Reading the defender's hand for the reaction check, on the
 * ATTACKER's own optimistic client, hits exactly that placeholder. This is NOT specific to the bot
 * — it reproduces identically in human-vs-human local or online play, any time the defender simply
 * has a reaction-eligible card in hand.
 */
describe("cards/db: getCard tolerates the playerView redaction placeholder", () => {
  it("returns a safe, keyword-less stand-in instead of throwing", () => {
    expect(() => getCard(REDACTED_CARD_ID)).not.toThrow();
    const card = getCard(REDACTED_CARD_ID);
    expect(card.keywords).toEqual([]);
  });

  it("still throws for a genuinely unknown/typo'd card id", () => {
    expect(() => getCard("this-card-id-does-not-exist")).toThrow(/Unknown card id/);
  });

  it("attackBattlefield doesn't crash when the defender's hand is a playerView-redacted copy (simulating the attacker's own optimistic client-side pass)", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    game.players["1"].hand = ["ogn-64"]; // Wind Wall — real [Reaction] card

    // Simulate exactly what the ATTACKER's own boardgame.io client optimistically operates on:
    // its local G, filtered from ITS OWN perspective (playerID "0") — which redacts player "1"'s
    // hand, since from "0"'s client that's the opponent's private zone.
    const redactedView = playerView({ G: game, playerID: "0" });
    expect(redactedView.players["1"].hand).toEqual([REDACTED_CARD_ID]);

    expect(() => attackBattlefield(ctxArgs(redactedView, "0"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] })).not.toThrow();
    // The window still opens (a real player CAN'T tell redacted-but-present from a genuine
    // reaction card without the real identity, so the conservative optimistic guess must still
    // err toward "maybe" here — hasReactionOrActionSpellInHand only needs ANY hand entry with the
    // keyword, and our stand-in has none, so this documents today's actual (permissive: it treats
    // any non-empty redacted hand as "no visible reaction/action keyword" and skips the window on
    // this OPTIMISTIC pass) behavior rather than asserting a stronger guarantee this fix doesn't
    // provide — the important, tested property is simply that it doesn't crash. The AUTHORITATIVE
    // master-side execution, against the true G, still opens the window correctly (see
    // ai/boardgameBot.ts's/aiBoardgameBot.test.ts's equivalent coverage against the true G).
    expect(redactedView.pendingCombatReaction).toBeNull();
  });
});
