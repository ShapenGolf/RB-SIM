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

const STEPS = [
  { key: "legend", label: "1. Legend" },
  { key: "main", label: "2. Main Deck" },
  { key: "runes", label: "3. Runen" },
  { key: "battlefields", label: "4. Battlefields" },
  { key: "champion", label: "5. Champion" },
  { key: "save", label: "6. Speichern" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

export function DeckBuilder({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState<StepKey>("legend");
  const [legendId, setLegendId] = useState<string | null>(null);
  const [mainDeck, setMainDeck] = useState<string[]>([]);
  const [chosenChampionId, setChosenChampionId] = useState<string | null>(null);
  const [runeDeck, setRuneDeck] = useState<string[]>([]);
  const [battlefields, setBattlefields] = useState<string[]>([]);
  const [deckName, setDeckName] = useState("");
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(() => listSavedDecks());
  const [legendSearch, setLegendSearch] = useState("");
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
    if (id === legendId) return;
    setLegendId(id);
    resetDeck();
  }

  const filteredLegends = useMemo(() => {
    const q = legendSearch.trim().toLowerCase();
    return q === "" ? ALL_LEGENDS : ALL_LEGENDS.filter((c) => c.name.toLowerCase().includes(q));
  }, [legendSearch]);

  const eligibleMainCards = useMemo(() => {
    if (!legend) return [];
    const q = search.trim().toLowerCase();
    return ALL_CARDS.filter(
      (c) =>
        (mainFilter === "all" ? MAIN_DECK_TYPES.includes(c.type) : c.type === mainFilter) &&
        fitsDomainIdentity(c, legendDomains) &&
        (q === "" || c.name.toLowerCase().includes(q)),
    )
      .sort((a, b) => {
        // Champions matching the Legend's tag (i.e. eligible as Chosen Champion) sort first,
        // so they're easy to spot instead of being buried among same-domain champions that
        // can never be chosen — the #1 source of "no matching champion" confusion at step 5.
        const aMatch = a.type === "champion" && matchesLegendTag(a, legendTags) ? 0 : 1;
        const bMatch = b.type === "champion" && matchesLegendTag(b, legendTags) ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 60);
  }, [legend, legendDomains, legendTags, search, mainFilter]);

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
    setStep("legend");
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
    setStep("legend");
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  function goStep(delta: number) {
    const next = STEPS[stepIndex + delta];
    if (next) setStep(next.key);
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

      {legend && (
        <div className="rb-db-summary">
          <span>
            <b>{legend.name}</b> ({legendDomains.join("/")})
          </span>
          <span>Main Deck: {mainDeck.length}/40+</span>
          <span>Runen: {runeDeck.length}/12</span>
          <span>Battlefields: {battlefields.length}/3</span>
          <span>Champion: {chosenChampionId ? getCard(chosenChampionId).name : "offen"}</span>
        </div>
      )}

      <div className="rb-db-wizard-tabs">
        {STEPS.map((s) => (
          <button
            key={s.key}
            className={`rb-db-wizard-tab${s.key === step ? " active" : ""}`}
            onClick={() => setStep(s.key)}
            disabled={s.key !== "legend" && !legend}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="rb-db-panel">
        {step === "legend" && (
          <>
            <div className="rb-section-label">Legend wählen</div>
            <input
              className="rb-db-search"
              placeholder="Legend suchen…"
              value={legendSearch}
              onChange={(e) => setLegendSearch(e.target.value)}
            />
            <div className="rb-db-card-grid rb-db-legend-grid">
              {filteredLegends.slice(0, 60).map((c) => (
                <CardFace
                  key={c.id}
                  card={c}
                  size="sm"
                  selected={c.id === legendId}
                  onClick={() => pickLegend(c.id)}
                  footer={<div className="rb-db-legend-name">{c.name}</div>}
                />
              ))}
            </div>

            {savedDecks.length > 0 && (
              <>
                <div className="rb-section-label" style={{ marginTop: 18 }}>
                  Gespeicherte Decks
                </div>
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
          </>
        )}

        {step === "main" && legend && (
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
            {mainFilter === "champion" && (
              <p className="rb-db-hint">
                ★ = passt als Chosen Champion zu {legend.name} (Tag stimmt überein). Andere Champions kannst du trotzdem ins
                Main Deck legen, aber nur ein markierter kann dein Chosen Champion werden.
              </p>
            )}
            <div className="rb-db-card-grid rb-db-browse-grid">
              {eligibleMainCards.map((c) => {
                const isMatchingChampion = c.type === "champion" && matchesLegendTag(c, legendTags);
                return (
                  <CardFace
                    key={c.id}
                    card={c}
                    size="sm"
                    footer={
                      <div className="rb-db-stepper">
                        {isMatchingChampion && <span title={`Passt zu ${legend.name}`}>★</span>}
                        <span>{mainDeckNameCounts.get(c.name) ?? 0}x</span>
                        <button onClick={() => addMainCopy(c)} disabled={(mainDeckNameCounts.get(c.name) ?? 0) >= copyLimitFor(c)}>
                          +
                        </button>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </>
        )}

        {step === "runes" && legend && (
          <>
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
          </>
        )}

        {step === "battlefields" && legend && (
          <>
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

        {step === "champion" && legend && (
          <>
            <div className="rb-section-label">
              Chosen Champion
              <span className="rb-count">{chosenChampionId ? "gewählt" : "offen"}</span>
            </div>
            {championOptions.length === 0 ? (
              <p className="rb-db-hint">
                Noch kein passender Champion im Main Deck. Geh zu Schritt 2 und füge einen Champion hinzu, dessen Tag zu{" "}
                {legend.name} passt.
              </p>
            ) : (
              <div className="rb-db-card-grid">
                {championOptions.map((c) => (
                  <CardFace
                    key={c.id}
                    card={c}
                    size="sm"
                    selected={c.id === chosenChampionId}
                    onClick={() => setChosenChampionId(c.id)}
                    footer={<div className="rb-db-legend-name">{c.name}</div>}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {step === "save" && legend && (
          <>
            <div className="rb-section-label">Legalität</div>
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

        {step !== "legend" && !legend && <p className="rb-db-hint">Wähle zuerst eine Legend (Schritt 1).</p>}

        <div className="rb-db-wizard-nav">
          <button onClick={() => goStep(-1)} disabled={stepIndex === 0}>
            ← Zurück
          </button>
          <button onClick={() => goStep(1)} disabled={stepIndex === STEPS.length - 1 || !legend}>
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
}
