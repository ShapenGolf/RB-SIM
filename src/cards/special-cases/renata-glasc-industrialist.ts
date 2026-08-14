import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** Your tokens enter ready. */
export const renataGlascIndustrialist: SpecialCaseHandler = {
  cardId: "renata-glasc-industrialist",
  othersEnterReady: (_ctx, newInstance) => getCard(newInstance.cardId).setCode === "TOKEN",
};
