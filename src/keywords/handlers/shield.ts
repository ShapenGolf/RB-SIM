import type { KeywordHandler } from "../types";

/** Shield [X]: "I have +X Might while I am defending." */
export const shieldHandler: KeywordHandler = {
  name: "shield",
  defendingMightModifier: (ctx) => ctx.keyword.value ?? 0,
};
