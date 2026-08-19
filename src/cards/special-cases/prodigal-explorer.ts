import type { SpecialCaseHandler } from "./types";

const THRESHOLD = 2;

/**
 * (Legend.) Exhaust: [Reaction] — Draw 1. Use only if you've chosen enemy units and/or gear
 * twice this turn with spells or unit abilities.
 *
 * Uses PlayerState.chosenEnemyTargetsThisTurn (see cards/special-cases/registry.ts onChosen, the
 * "chosen as a target" chokepoint — jae-medarda.ts proved this broadcast already exists and
 * works). "Get the effect only if..." modeled the same way as Hand of Noxus's Legion gate: the
 * ability doesn't exist at all (activatedAbilityCost returns undefined) until the condition is
 * met. [Reaction] timing isn't modeled — activatable any time like every other Exhaust ability
 * (same simplification as bullet-time.ts's [Action] timing note).
 */
export const prodigalExplorer: SpecialCaseHandler = {
  cardId: "prodigal-explorer",
  activatedAbilityCost: (ctx) => {
    if (ctx.game.players[ctx.instance.controller].chosenEnemyTargetsThisTurn < THRESHOLD) return undefined;
    return { energy: 0, exhaustSelf: true };
  },
  onActivate: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
