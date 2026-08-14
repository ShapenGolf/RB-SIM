import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** Your token units have +1 Might. */
export const soulShepherd: SpecialCaseHandler = {
  cardId: "soul-shepherd",
  staticMightModifierForAlly: (_ctx, ally) => (getCard(ally.cardId).setCode === "TOKEN" ? 1 : 0),
};
