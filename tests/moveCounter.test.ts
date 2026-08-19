import { describe, it, expect, vi } from "vitest";
import { attackBattlefield } from "../src/game/moves";
import { createInstance } from "../src/game/setup";
import { runTurnStart } from "../src/game/turnFlow";
import { dealSpellDamage } from "../src/game/spellDamage";
import { getCard } from "../src/cards/db";
import { makeGame } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  const setActivePlayers = vi.fn();
  return { G, playerID, events: { setActivePlayers } } as unknown as Parameters<typeof attackBattlefield>[0];
}

/**
 * CardInstance.movesThisTurn (game/state.ts): incremented once per attackBattlefield call for the
 * moving unit (game/moves.ts), covering both the initial base-to-battlefield attack and any
 * subsequent Ganking battlefield-to-battlefield move. Exercised here via Kayn, Unleashed ("If I
 * have moved twice this turn, I don't take damage.") and Yasuo, Windrider ("The third time I move
 * in a turn, you score 1 point.") — both rely on this counter.
 *
 * Note: every one of these test moves is an undefended walk-in, which combat.ts's conquerBattlefield
 * unconditionally awards 1 point for regardless of Yasuo's own ability (rule-accurate — conquering
 * an empty Battlefield always scores). The Yasuo test tracks the point DELTA per move rather than
 * an absolute total, so that baseline conquest scoring doesn't mask (or get mistaken for) the
 * ability's own +1 on exactly the third move.
 */
describe("CardInstance.movesThisTurn", () => {
  it("Kayn, Unleashed (ogn-189): takes damage normally before moving twice, then becomes immune", () => {
    const game = makeGame();
    const kayn = createInstance(game, "ogn-189", "0");
    kayn.exhausted = false; // createInstance defaults to exhausted; putOnBase normally clears this
    game.players["0"].base.push(kayn.instanceId);

    // Move 1: base -> battlefield 0 (always legal, no Ganking needed).
    let result = attackBattlefield(ctx(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [kayn.instanceId] });
    expect(result).toBeUndefined();
    expect(kayn.movesThisTurn).toBe(1);

    dealSpellDamage(game, getCard, kayn.instanceId, 1, "1");
    expect(kayn.damage).toBe(1); // not yet immune after only 1 move

    kayn.exhausted = false; // bypass normal readying, which only happens at Awaken
    // Move 2: battlefield 0 -> battlefield 1 (Ganking).
    result = attackBattlefield(ctx(game, "0"), { battlefieldIndex: 1, unitInstanceIds: [kayn.instanceId] });
    expect(result).toBeUndefined();
    expect(kayn.movesThisTurn).toBe(2);

    dealSpellDamage(game, getCard, kayn.instanceId, 3, "1");
    expect(kayn.damage).toBe(1); // still 1 — the new damage was fully prevented
  });

  it("Yasuo, Windrider (sfd-235): scores an EXTRA point on exactly the third move, not before or after", () => {
    const game = makeGame();
    const yasuo = createInstance(game, "sfd-235", "0");
    yasuo.exhausted = false;
    game.players["0"].base.push(yasuo.instanceId);

    const pointsAfterMove = (battlefieldIndex: number) => {
      const before = game.players["0"].points;
      yasuo.exhausted = false;
      attackBattlefield(ctx(game, "0"), { battlefieldIndex, unitInstanceIds: [yasuo.instanceId] });
      return game.players["0"].points - before;
    };

    expect(pointsAfterMove(0)).toBe(1); // move 1: conquest only
    expect(pointsAfterMove(1)).toBe(1); // move 2: conquest only
    expect(pointsAfterMove(0)).toBe(2); // move 3: conquest + Yasuo's own +1
    expect(pointsAfterMove(1)).toBe(1); // move 4: conquest only again, ability doesn't re-fire
  });

  it("resets to 0 at Awaken (turn start)", () => {
    const game = makeGame();
    const kayn = createInstance(game, "ogn-189", "0");
    kayn.exhausted = false; // createInstance defaults to exhausted; putOnBase normally clears this
    game.players["0"].base.push(kayn.instanceId);
    attackBattlefield(ctx(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [kayn.instanceId] });
    expect(kayn.movesThisTurn).toBe(1);

    runTurnStart(game, "0");

    expect(kayn.movesThisTurn).toBe(0);
  });
});
