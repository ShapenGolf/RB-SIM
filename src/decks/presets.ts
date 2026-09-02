import type { SavedDeck } from "./store";

/**
 * Ready-to-play decks, always available alongside whatever the player has saved themselves —
 * building a legal 40-card deck from scratch in the deck builder is a lot of clicking, and a
 * playtester asked for something to just pick up and play while still being free to build their
 * own. NOT a reproduction of Riftbound's real retail preconstructed decks — this sandbox has no
 * outbound web access to verify those lists against, so these are original 40-card builds
 * assembled from the real official card catalog (single Legend, on-curve, in its Domain
 * Identity) rather than a claim of matching an actual precon 1:1. `homebrewCorvennaDeck` is this
 * simulator's own original class (see src/cards/data/homebrew-set.json) — not from the official
 * catalog at all, clearly not presented as one.
 *
 * ids are prefixed "preset-" so they never collide with a player's own saved-deck ids (random
 * timestamps, see decks/store.ts's handleSave) — DeckBuilder.tsx treats that prefix as
 * read-only (loading one for editing starts a fresh copy instead of overwriting the preset).
 */
export const PRESET_DECKS: SavedDeck[] = [
  {
    id: "preset-lillia-calm-mind",
    name: "Bashful Bloom — Lillia (Calm/Mind, Beispiel-Deck)",
    deck: {
      legendId: "unl-230",
      chosenChampionId: "unl-82",
      mainDeck: [
        ...Array(3).fill("unl-82"),
        ...Array(3).fill("sfd-226"),
        ...Array(3).fill("sfd-229"),
        ...Array(3).fill("sfd-80"),
        ...Array(3).fill("ogn-43"),
        ...Array(3).fill("sfd-63"),
        ...Array(3).fill("sfd-64"),
        ...Array(3).fill("unl-31"),
        ...Array(3).fill("ven-39"),
        ...Array(3).fill("ven-40"),
        ...Array(3).fill("ven-61"),
        ...Array(3).fill("ogn-45"),
        ...Array(3).fill("sfd-33"),
        "ogn-46",
      ],
      runeDeck: [...Array(6).fill("ogn-42"), ...Array(6).fill("ogn-89")],
      battlefields: ["unl-205", "unl-206", "ogn-275"],
    },
  },
  {
    id: "preset-sivir-body-chaos",
    name: "Battle Mistress — Sivir (Body/Chaos, Beispiel-Deck)",
    deck: {
      legendId: "sfd-203",
      chosenChampionId: "sfd-120",
      mainDeck: [
        ...Array(3).fill("sfd-120"),
        ...Array(3).fill("sfd-122"),
        ...Array(3).fill("sfd-234"),
        ...Array(3).fill("sfd-231"),
        ...Array(3).fill("ogn-179"),
        ...Array(3).fill("unl-109"),
        ...Array(3).fill("sfd-134"),
        ...Array(3).fill("ven-107"),
        ...Array(3).fill("ven-85"),
        ...Array(3).fill("unl-111"),
        ...Array(3).fill("sfd-124"),
        ...Array(3).fill("unl-134"),
        ...Array(3).fill("sfd-135"),
        "ogn-133",
      ],
      runeDeck: [...Array(6).fill("ogn-126"), ...Array(6).fill("ogn-166")],
      battlefields: ["unl-205", "unl-206", "ogn-275"],
    },
  },
  {
    id: "preset-corvenna-chaos-order",
    name: "Vault of Broken Futures — Corvenna (Chaos/Order, Homebrew)",
    deck: {
      legendId: "hb-corvenna-legend",
      chosenChampionId: "hb-corvenna-oracle-ash",
      mainDeck: [
        ...Array(3).fill("hb-corvenna-oracle-ash"),
        ...Array(3).fill("hb-ashbound-sentinel"),
        ...Array(3).fill("hb-fatewoven-skirmisher"),
        ...Array(3).fill("hb-hourglass-warden"),
        ...Array(3).fill("hb-splinterfate-raider"),
        ...Array(3).fill("hb-ashfall-prophet"),
        ...Array(3).fill("hb-dust-reaver"),
        ...Array(3).fill("hb-broken-oath-duelist"),
        ...Array(3).fill("hb-chronicle-binder"),
        ...Array(3).fill("hb-fractured-omen"),
        ...Array(3).fill("hb-cinder-verdict"),
        ...Array(2).fill("hb-echo-of-what-was"),
        ...Array(2).fill("hb-severed-thread"),
        ...Array(2).fill("hb-hourglass-blade"),
        "hb-shard-of-the-unmade",
      ],
      runeDeck: [...Array(6).fill("ogn-166"), ...Array(6).fill("ogn-214")],
      battlefields: ["unl-205", "unl-206", "ogn-275"],
    },
  },
];

export const PRESET_DECK_ID_PREFIX = "preset-";
export function isPresetDeck(id: string): boolean {
  return id.startsWith(PRESET_DECK_ID_PREFIX);
}
