import { useMemo, useState } from "react";
import { getCard, listOfficialCards } from "../cards/db";
import type { Card, CardType } from "../cards/types";
import { validateDeck, copyLimitFor, type DeckList } from "../cards/deckValidation";
import { deleteDeck, listSavedDecks, saveDeck, type SavedDeck } from "../decks/store";
import { CardFace } from "./CardFace";

function fitsDomainIdentity(card: Card, legendDomains: Card["domains"]): boolean {
  return card.domains.every((d) => d === "Colorless" || legendDomains.includes(d));
}

function matchesLegendTag(card: Card, legendTags: string[]): boolean {
  const cardTags = card.tags ?? [];
  return legendTags.every((t) => cardTags.includes(t));
}

function groupCounts(ids: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

const ALL_CARDS = listOfficialCards();
const ALL_LEGENDS = ALL_CARDS.filter((c) => c.type === "legend").sort((a, b) => a.name.localeCompare(b.name));
const ALL_RUNES = ALL_CARDS.filter((c) => c.type === "rune");
const ALL_BATTLEFIELDS = ALL_CARDS.filter((c) => c.type === "battlefield").sort((a, b) => a.name.localeCompare(b.name));

const MAIN_DECK_TYPES: CardType[] = ["unit", "champion", "gear", "spell"];
type MainFilter = "all" | CardType;

export function DeckBuilder({ onExit }: { onExit: () => void }) {
  const [legendId, setLegendId] = useState<string | null>(null);
  const [mainDeck, setMainDeck] = useState<string[]>([]);
  const [chosenChampionId, setChosenChampionId] = useState<string | null>(null);
  const [runeDeck, setRuneDeck] = useState<string[]>([]);
  const [battlefields, setBattlefields] = useState<string[]>([]);
  const [deckName, setDeckName] = useState("");
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(() => listSavedDecks());
  const [search, setSearch] = useState("");
  const [mainFilter, setMainFilter] = useState<MainFilter>("all");
  const [bfSearch, setBfSearch] = useState("");

  const legend = legendId ? getCard(legendId) : null;
  const legendDomains = legend?.domains ?? [];
  const legendTags = legend?.tags ?? [];

  function resetDeck() {
    setMainDeck([]);
    setChosenChampionId(null);
    setRuneDeck([]);
    setBattlefields([]);
  }

  function pickLegend(id: string) {
    setLegendId(id || null);
    resetDeck();
  }

  const eligibleMainCards = useMemo(() => {
    if (!legend) return [];
    const q = search.trim().toLowerCase();
    return ALL_CARDS.filter(
      (c) =>
        (mainFilter === "all" ? MAIN_DECK_TYPES.includes(c.type) : c.type === mainFilter) &&
        fitsDomainIdentity(c, legendDomains) &&
        (q === "" || c.name.toLowerCase().includes(q)),
    )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 60);
  }, [legend, legendDomains, search, mainFilter]);

  const eligibleRunes = useMemo(
    () => (legend ? ALL_RUNES.filter((c) => fitsDomainIdentity(c, legendDomains)) : []),
    [legend, legendDomains],
  );

  const filteredBattlefields = useMemo(() => {
    const q = bfSearch.trim().toLowerCase();
    return q === "" ? ALL_BATTLEFIELDS : ALL_BATTLEFIELDS.filter((c) => c.name.toLowerCase().includes(q));
  }, [bfSearch]);

  const mainDeckCounts = useMemo(() => groupCounts(mainDeck), [mainDeck]);
  const runeDeckCounts = useMemo(() => groupCounts(runeDeck), [runeDeck]);
  // The 3-copy limit is per full card *name* (docs/deck-building-rules.md), not per printing —
  // some cards have multiple ids sharing a name (alt-art/showcase variants), which the plain
  // per-id mainDeckCounts above would under-enforce.
  const mainDeckNameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of mainDeck) {
      const name = getCard(id).name;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  }, [mainDeck]);

  const championOptions = useMemo(() => {
    if (!legend) return [];
    const seen = new Set<string>();
    const options: Card[] = [];
    for (const id of mainDeck) {
      const c = getCard(id);
      if (c.type === "champion" && matchesLegendTag(c, legendTags) && !seen.has(c.id)) {
        seen.add(c.id);
        options.push(c);
      }
    }
    return options;
  }, [mainDeck, legend, legendTags]);

  function addMainCopy(card: Card) {
    const current = mainDeckNameCounts.get(card.name) ?? 0;
    if (current >= copyLimitFor(card)) return;
    setMainDeck((prev) => [...prev, card.id]);
  }
  function removeMainCopy(cardId: string) {
    setMainDeck((prev) => {
      const idx = prev.lastIndexOf(cardId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      if (cardId === chosenChampionId && !next.includes(cardId)) setChosenChampionId(null);
      return next;
    });
  }
  function addRuneCopy(cardId: string) {
    if (runeDeck.length >= 12) return;
    setRuneDeck((prev) => [...prev, cardId]);
  }
  function removeRuneCopy(cardId: string) {
    setRuneDeck((prev) => {
      const idx = prev.lastIndexOf(cardId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }
  function toggleBattlefield(cardId: string) {
    setBattlefields((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length >= 3) return prev;
      const name = getCard(cardId).name;
      if (prev.some((id) => getCard(id).name === name)) return prev;
      return [...prev, cardId];
    });
  }

  const deckList: DeckList = {
    legendId: legendId ?? "",
    chosenChampionId: chosenChampionId ?? "",
    mainDeck,
    runeDeck,
    battlefields,
  };
  const issues = legendId ? validateDeck(deckList) : [];

  function handleSave() {
    if (!legendId) return;
    const id = editingDeckId ?? `deck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    saveDeck({ id, name: deckName.trim() || "Unbenanntes Deck", deck: deckList });
    setEditingDeckId(id);
    setSavedDecks(listSavedDecks());
  }
  function handleLoad(saved: SavedDeck) {
    setLegendId(saved.deck.legendId || null);
    setMainDeck(saved.deck.mainDeck);
    setChosenChampionId(saved.deck.chosenChampionId || null);
    setRuneDeck(saved.deck.runeDeck);
    setBattlefields(saved.deck.battlefields);
    setDeckName(saved.name);
    setEditingDeckId(saved.id);
  }
  function handleDelete(id: string) {
    deleteDeck(id);
    setSavedDecks(listSavedDecks());
    if (editingDeckId === id) {
      setEditingDeckId(null);
      setDeckName("");
    }
  }
  function handleNew() {
    setLegendId(null);
    resetDeck();
    setDeckName("");
    setEditingDeckId(null);
  }

  return (
    <div className="rb-board rb-deckbuilder">
      <div className="rb-topbar">
        <h2>Deckbuilder</h2>
        <div className="rb-toolbar">
          <button onClick={handleNew}>Neues Deck</button>
          <button onClick={onExit}>Zurück zum Menü</button>
        </div>
      </div>

      <div className="rb-db-columns">
        <div className="rb-db-panel">
          <div className="rb-section-label">Legend</div>
          <select className="rb-db-select" value={legendId ?? ""} onChange={(e) => pickLegend(e.target.value)}>
            <option value="">— Legend wählen —</option>
            {ALL_LEGENDS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.domains.join("/")})
              </option>
            ))}
          </select>

          {legend && (
            <>
              <div className="rb-section-label">
                Chosen Champion
                <span className="rb-count">{chosenChampionId ? "gewählt" : "offen"}</span>
              </div>
              <select
                className="rb-db-select"
                value={chosenChampionId ?? ""}
                onChange={(e) => setChosenChampionId(e.target.value || null)}
                disabled={championOptions.length === 0}
              >
                <option value="">
                  {championOptions.length === 0 ? "— erst passenden Champion ins Main Deck legen —" : "— Champion wählen —"}
                </option>
                {championOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="rb-section-label">
                Rune Deck
                <span className="rb-count">{runeDeck.length}/12</span>
              </div>
              <div className="rb-db-rune-list">
                {eligibleRunes.map((c) => (
                  <div key={c.id} className="rb-db-rune-row">
                    <span>{c.name}</span>
                    <div className="rb-db-stepper">
                      <button onClick={() => removeRuneCopy(c.id)} disabled={(runeDeckCounts.get(c.id) ?? 0) === 0}>
                        −
                      </button>
                      <b>{runeDeckCounts.get(c.id) ?? 0}</b>
                      <button onClick={() => addRuneCopy(c.id)} disabled={runeDeck.length >= 12}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rb-section-label">
                Battlefields
                <span className="rb-count">{battlefields.length}/3</span>
              </div>
              <input
                className="rb-db-search"
                placeholder="Battlefield suchen…"
                value={bfSearch}
                onChange={(e) => setBfSearch(e.target.value)}
              />
              <div className="rb-db-card-grid rb-db-battlefield-grid">
                {filteredBattlefields.slice(0, 30).map((c) => (
                  <CardFace
                    key={c.id}
                    card={c}
                    size="sm"
                    selected={battlefields.includes(c.id)}
                    onClick={() => toggleBattlefield(c.id)}
                  />
                ))}
              </div>
            </>
          )}

          {savedDecks.length > 0 && (
            <>
              <div className="rb-section-label">Gespeicherte Decks</div>
              <div className="rb-db-saved-list">
                {savedDecks.map((d) => (
                  <div key={d.id} className="rb-db-saved-row">
                    <span>{d.name}</span>
                    <div className="rb-toolbar">
                      <button onClick={() => handleLoad(d)}>Laden</button>
                      <button onClick={() => handleDelete(d.id)}>Löschen</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rb-db-panel rb-db-panel-wide">
          {!legend ? (
            <p className="rb-db-hint">Wähle zuerst eine Legend, um Karten für dein Main Deck zu sehen.</p>
          ) : (
            <>
              <div className="rb-section-label">
                Main Deck
                <span className="rb-count">{mainDeck.length}/40+</span>
              </div>
              <div className="rb-db-card-grid rb-db-maindeck-grid">
                {[...mainDeckCounts.entries()].map(([id, count]) => {
                  const c = getCard(id);
                  return (
                    <CardFace
                      key={id}
                      card={c}
                      size="sm"
                      footer={
                        <div className="rb-db-stepper">
                          <button onClick={() => removeMainCopy(id)}>−</button>
                          <b>{count}</b>
                          <button onClick={() => addMainCopy(c)} disabled={(mainDeckNameCounts.get(c.name) ?? 0) >= copyLimitFor(c)}>
                            +
                          </button>
                        </div>
                      }
                    />
                  );
                })}
                {mainDeck.length === 0 && <p className="rb-db-hint">Noch keine Karten gewählt.</p>}
              </div>

              <div className="rb-section-label" style={{ marginTop: 18 }}>
                Karten durchsuchen
              </div>
              <div className="rb-toolbar" style={{ marginBottom: 6 }}>
                {(["all", "unit", "champion", "gear", "spell"] as MainFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMainFilter(f)}
                    style={f === mainFilter ? { color: "#fff", borderColor: "#fff" } : undefined}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <input
                className="rb-db-search"
                placeholder="Kartenname suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="rb-db-card-grid rb-db-browse-grid">
                {eligibleMainCards.map((c) => (
                  <CardFace
                    key={c.id}
                    card={c}
                    size="sm"
                    footer={
                      <div className="rb-db-stepper">
                        <span>{mainDeckNameCounts.get(c.name) ?? 0}x</span>
                        <button onClick={() => addMainCopy(c)} disabled={(mainDeckNameCounts.get(c.name) ?? 0) >= copyLimitFor(c)}>
                          +
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>

              <div className="rb-section-label" style={{ marginTop: 18 }}>
                Legalität
              </div>
              {issues.length === 0 ? (
                <div className="rb-callout" style={{ borderColor: "#22c55e" }}>
                  Dieses Deck ist legal.
                </div>
              ) : (
                <div className="rb-callout warn">
                  <ul className="rb-db-issue-list">
                    {issues.map((issue, i) => (
                      <li key={i}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rb-db-save-row">
                <input
                  className="rb-db-search"
                  placeholder="Deckname"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                />
                <button className="rb-end-turn" onClick={handleSave} disabled={issues.length > 0}>
                  Deck speichern
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
