import type { DeckList } from "../cards/deckValidation";
import { PRESET_DECKS } from "./presets";

/** A deck the player has named and saved, so it can be picked again later without rebuilding it (see docs/deck-building-rules.md). */
export interface SavedDeck {
  id: string;
  name: string;
  deck: DeckList;
}

const STORAGE_KEY = "rb-sim:decks";

function readAll(): SavedDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedDeck[]) : [];
  } catch {
    return [];
  }
}

function writeAll(decks: SavedDeck[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

/** The player's own saved decks PLUS the always-available preset decks (see decks/presets.ts) — every UI that lists decks to pick from should use this, not readAll() directly. */
export function listSavedDecks(): SavedDeck[] {
  return [...PRESET_DECKS, ...readAll()];
}

export function getSavedDeck(id: string): SavedDeck | undefined {
  return PRESET_DECKS.find((d) => d.id === id) ?? readAll().find((d) => d.id === id);
}

/** Inserts or overwrites (by id) a saved deck. */
export function saveDeck(saved: SavedDeck): void {
  const all = readAll();
  const idx = all.findIndex((d) => d.id === saved.id);
  if (idx >= 0) all[idx] = saved;
  else all.push(saved);
  writeAll(all);
}

export function deleteDeck(id: string): void {
  writeAll(readAll().filter((d) => d.id !== id));
}
