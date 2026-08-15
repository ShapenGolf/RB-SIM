import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;

/**
 * As you play me, add the Baron Pit battlefield token to the board if it's not there already. If
 * you do, I enter there. I can't be chosen by enemy spells and abilities. Other friendly units
 * have +2 Might.
 *
 * Known gaps: adding a 3rd Battlefield to the board mid-game isn't modeled (the engine assumes a
 * fixed 2-Battlefield board throughout), and target-immunity ("can't be chosen by enemy spells
 * and abilities") isn't enforced anywhere in the engine — both deliberately deferred (see
 * docs/data-sourcing.md). Only the Might aura is implemented.
 */
export const baronNashor: SpecialCaseHandler = {
  cardId: "baron-nashor",
  staticMightModifierForAlly: () => MIGHT_BONUS,
};
