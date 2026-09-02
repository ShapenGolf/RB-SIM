import type { SavedDeck } from "./store";

/**
 * Ready-to-play decks, always available alongside whatever the player has saved themselves —
 * building a legal 40-card deck from scratch in the deck builder is a lot of clicking, and a
 * playtester asked for something to just pick up and play while still being free to build their
 * own.
 *
 * The four Lee Sin/Lillia/Viktor/Ornn decks were supplied directly by a playtester as real
 * decklists (unit/gear/spell/rune names + counts, presumably from some deck-pricing site's
 * export) and are used essentially as given — this sandbox has no outbound web access to verify
 * them against Riftbound's actual retail precon lists itself, so "used as given" is the honest
 * claim here, not "verified to match the real precon." Each card name was resolved to its real
 * catalog id (picking one printing where a name has several) and the whole list re-checked
 * against validateDeck. Lee Sin's own source list had empty CHAMPION and BATTLEFIELDS categories
 * ("Missing / Not available" — the export tool's own gap, since a real 39-card deck with no
 * Chosen Champion isn't legal) — filled in with a real "Lee Sin"-tagged champion print and the
 * same 3 battlefields reused below, since the source didn't supply either.
 *
 * `homebrewCorvennaDeck` is this simulator's own original class (see
 * src/cards/data/homebrew-set.json) — not from the official catalog at all, and not presented as
 * one (see that file's own sourceNote on every card).
 *
 * ids are prefixed "preset-" so they never collide with a player's own saved-deck ids (random
 * timestamps, see decks/store.ts's handleSave) — DeckBuilder.tsx treats that prefix as
 * read-only (loading one for editing starts a fresh copy instead of overwriting the preset).
 */
export const PRESET_DECKS: SavedDeck[] = [
  {
    // Source list's CHAMPION/BATTLEFIELDS categories were empty — see the file-level comment.
    id: "preset-leesin-calm-body",
    name: "Blind Monk — Lee Sin (Calm/Body)",
    deck: {
      legendId: "ogn-257",
      chosenChampionId: "ogn-151",
      mainDeck: [
        ...Array(3).fill("sfd-36"), // Lonely Poro
        ...Array(2).fill("ogn-136"), // Pit Rookie
        ...Array(3).fill("unl-53"), // Scuttle Crab
        ...Array(3).fill("ogn-132"), // First Mate
        ...Array(3).fill("sfd-113"), // Lucian, Merciless
        ...Array(2).fill("ven-179"), // Rengar, Trophy Hunter
        "sfd-232", // Sett, Brawler
        ...Array(2).fill("sfd-51"), // Guardian Angel
        "sfd-52", // Heart of Dark Ice
        ...Array(2).fill("ogn-43"), // Charm
        ...Array(3).fill("ogn-45"), // Defy
        ...Array(3).fill("sfd-97"), // Punch First
        "ogn-156", // Sabotage
        ...Array(3).fill("ogn-58"), // Discipline
        ...Array(2).fill("ven-34"), // Resonating Strike
        "unl-42", // Back Off
        ...Array(2).fill("ven-83"), // Rampage
        "ogn-258", // Dragon's Rage ([Signature], tagged "Lee Sin")
        "ven-81", // Onslaught
        "ogn-151", // Lee Sin, Centered — Chosen Champion (not in the source list, see above)
      ],
      runeDeck: [...Array(7).fill("ogn-126"), ...Array(5).fill("ogn-42")],
      battlefields: ["unl-205", "unl-206", "ogn-275"], // not in the source list, see above
    },
  },
  {
    id: "preset-lillia-calm-mind",
    name: "Bashful Bloom — Lillia (Calm/Mind)",
    deck: {
      legendId: "unl-230",
      chosenChampionId: "unl-82",
      mainDeck: [
        "unl-82", // Lillia, Fae Fawn (Chosen Champion)
        ...Array(2).fill("ven-43"), // Steel Paws
        ...Array(3).fill("ogn-103"), // Ravenbloom Student
        ...Array(2).fill("ven-38"), // Akali, Silent
        ...Array(2).fill("unl-80"), // Hwei, Brooding Painter
        ...Array(2).fill("ogn-116"), // Thousand-Tailed Watcher
        ...Array(3).fill("ogn-60"), // Mask of Foresight
        ...Array(3).fill("unl-78"), // Sprite Fountain
        ...Array(2).fill("sfd-52"), // Heart of Dark Ice
        ...Array(2).fill("ogn-45"), // Defy
        ...Array(2).fill("ogn-95"), // Stupefy
        ...Array(2).fill("ogn-58"), // Discipline
        "unl-190", // Lilting Lullaby
        ...Array(2).fill("unl-83"), // Smoke and Mirrors
        ...Array(2).fill("unl-42"), // Back Off
        ...Array(2).fill("unl-72"), // Crescent Strike
        ...Array(2).fill("ogn-94"), // Sprite Call
        ...Array(3).fill("unl-69"), // Sprite Burst
        ...Array(2).fill("ogn-123"), // Unchecked Power
      ],
      runeDeck: [...Array(4).fill("ogn-42"), ...Array(8).fill("ogn-89")],
      battlefields: ["unl-208", "unl-209", "ogn-289"], // Black Flame Altar, Dusk Rose Lab, Targon's Peak
    },
  },
  {
    id: "preset-viktor-mind-order",
    name: "Herald of the Arcane — Viktor (Mind/Order)",
    deck: {
      legendId: "ogn-308",
      chosenChampionId: "ogn-246",
      mainDeck: [
        "ogn-246", // Viktor, Leader (Chosen Champion)
        ...Array(3).fill("unl-153"), // Carrion Dredger
        ...Array(3).fill("sfd-155"), // Honest Broker
        ...Array(3).fill("sfd-74"), // Pickpocket
        ...Array(3).fill("sfd-176"), // Xin Zhao, Vigilant
        ...Array(2).fill("unl-176"), // Vi, Peacekeeper
        ...Array(3).fill("unl-78"), // Sprite Fountain
        ...Array(2).fill("sfd-80"), // Bellows Breath
        ...Array(3).fill("ogn-95"), // Stupefy
        ...Array(3).fill("ogn-209"), // Cull the Weak
        ...Array(3).fill("ogn-213"), // Hidden Blade
        "ogn-224", // Salvage
        ...Array(2).fill("ven-116"), // Dragon Form
        ...Array(3).fill("sfd-70"), // Wages of Pain
        ...Array(3).fill("ogn-221"), // Imperial Decree
        ...Array(2).fill("ogn-105"), // Singularity
      ],
      runeDeck: [...Array(6).fill("ogn-89"), ...Array(6).fill("ogn-214")],
      battlefields: ["unl-210", "sfd-216", "sfd-220"], // Forbidding Waste, Rockfall Path, Treasure Hoard
    },
  },
  {
    id: "preset-ornn-calm-mind",
    name: "Fire Below the Mountain — Ornn (Calm/Mind)",
    deck: {
      legendId: "sfd-244",
      chosenChampionId: "sfd-58",
      mainDeck: [
        "sfd-58", // Ornn, Blacksmith (Chosen Champion)
        ...Array(2).fill("ogn-44"), // Clockwork Keeper
        ...Array(3).fill("ven-58"), // Patched Porobot
        ...Array(3).fill("unl-53"), // Scuttle Crab
        ...Array(2).fill("sfd-61"), // Aspiring Engineer
        ...Array(3).fill("ogn-91"), // Pit Crew
        ...Array(3).fill("sfd-226"), // Seal of Focus
        "sfd-64", // Cloth Armor
        ...Array(3).fill("sfd-46"), // Poro Snax
        ...Array(3).fill("sfd-42"), // Brutalizer
        "sfd-51", // Guardian Angel
        "ogn-60", // Mask of Foresight
        ...Array(3).fill("unl-78"), // Sprite Fountain
        "sfd-52", // Heart of Dark Ice
        ...Array(3).fill("sfd-56"), // Sterak's Gage
        "ven-45", // Helm of Suppression
        ...Array(3).fill("ogn-43"), // Charm
        ...Array(3).fill("ogn-45"), // Defy
      ],
      runeDeck: [...Array(8).fill("ogn-42"), ...Array(4).fill("ogn-89")],
      battlefields: ["sfd-213", "sfd-217", "sfd-221"], // Ornn's Forge, Seat of Power, Veiled Temple
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
