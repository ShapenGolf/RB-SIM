import type { KeywordHandler } from "../types";

/** Assault [+X]: "While I am an attacker, I have +X Might." */
export const assaultHandler: KeywordHandler = {
  name: "assault",
  attackingMightModifier: (ctx) => ctx.keyword.value ?? 0,
};
