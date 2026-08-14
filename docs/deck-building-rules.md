# Deck-Building-Regeln (offiziell, vom Nutzer bereitgestellt 2026-08-14)

Quelle: riftbound.gg/rules (vom Nutzer kopiert, da für diese Sandbox nicht
per Netzwerk erreichbar — siehe `docs/data-sourcing.md`). Wortlaut unten
unverändert übernommen, danach die Übersetzung in unser Datenmodell.

## Originaltext

> Building a deck
>
> Four pieces: a Champion Legend, a 40+ card Main Deck, exactly 12 runes,
> and 3 battlefields.
>
> | Piece | Requirement |
> |---|---|
> | Champion Legend | Exactly 1. Its domains are your Domain Identity — every card in your deck must fit them. |
> | Main Deck | 40 cards minimum: units, gear, and spells, including your Chosen Champion. Up to 3 copies of any one name. |
> | Chosen Champion | A champion unit whose champion tag matches your Legend's tag. It starts the game in its own zone, ready to play. |
> | Rune Deck | Exactly 12 rune cards in your Domain Identity. |
> | Battlefields | 3 in your deck (standard modes) — how many reach the table depends on the mode. No duplicate battlefield names. |
> | Signature cards | At most 3 total across the whole deck, all bearing your Legend's champion tag. |
>
> Domain Identity is strict: a card showing one domain needs that domain on
> your Legend, and a multi-domain card needs all of its domains covered.
>
> **Common mistake**
> Signature units are not champion units — a signature card can never be
> your Chosen Champion, even when its tag matches your Legend. And during
> the game, every copy of the same-named card counts as your Chosen
> Champion, not just the physical one that started in the zone.
>
> **What the full rules say**
> - A card's full name is "Short Name, Subtitle" — Yasuo - Remorseful and
>   Yasuo - Windrider are different names, so 3 copies of each is legal.
> - The Chosen Champion counts toward its name's 3-copy limit: the chosen
>   copy plus up to 2 more in the Main Deck.
> - The signature limit of 3 is a sum across all signature cards of any
>   type, not 3 per name. Unique cards are further limited to 1 copy by
>   their own keyword.
> - Cards an effect adds to your deck ignoring Domain Identity count as
>   in-identity.

## Übersetzung in unser Datenmodell

- **Legend** (`Card.type === "legend"`): genau 1 pro Deck. `legend.domains`
  = Domain Identity.
- **"Champion tag" / Legend-Champion-Zuordnung**: empirisch aus den
  importierten Daten abgeleitet (der offizielle Text sagt nur "its champion
  tag matches your Legend's tag", ohne den Mechanismus zu spezifizieren).
  Jede Legend hat `tags` mit 1–2 Einträgen (meist nur der Champion-Name,
  z.B. `["Lillia"]`; Ausnahme `Heart of the Tempest`: `["Yordle","Kennen"]`).
  Passende Champion-Karten enthalten IMMER alle Legend-Tags als Teilmenge
  ihrer eigenen `tags` (z.B. Lillia-Champions: `["Fae","Lillia","Ionia"]`).
  Regel: `legend.tags.every(t => champion.tags.includes(t))`.
- **Main Deck**: `type` ∈ {unit, champion, gear, spell}, **mindestens 40**
  Karten (Nutzer-Text sagt "40 cards minimum" — nicht exakt 40, Kopfzeile
  "40+ card Main Deck" bestätigt das). Enthält den Chosen Champion mit.
  Max. 3 Kopien pro vollem Kartennamen (`Card.name`, das bei uns bereits
  "Kurzname, Untertitel" ist, z.B. "Lillia, Protector of Dreams" — passt
  exakt zur Regel). `[Unique]`-Keyword-Karten: max. 1 Kopie (überschreibt
  das 3er-Limit).
- **Chosen Champion**: genau 1 Karte mit `type === "champion"` aus dem Main
  Deck, deren Tags die Legend-Tags als Teilmenge enthalten (s.o.). Zählt
  zum eigenen 3-Kopien-Limit (die gewählte Kopie + bis zu 2 weitere im Main
  Deck).
- **Rune Deck**: genau 12 Karten mit `type === "rune"`, deren `domains` ⊆
  Domain Identity.
- **Battlefields**: genau 3 Karten mit `type === "battlefield"`, keine
  doppelten Namen (`Card.name`).
- **Signature-Karten**: neues Feld `Card.isSignature` (aus
  `cardType.superType` mit `id: "signature"` im Rohdatensatz, bisher nicht
  importiert — siehe `scripts/import-cards.mjs`). Summe über alle
  `isSignature`-Karten im ganzen Deck (Main Deck, nicht Rune/Battlefield) ≤
  3, unabhängig vom Namen. Jede Signature-Karte muss ebenfalls die
  Legend-Tags als Teilmenge ihrer eigenen Tags haben (gleiche Prüfung wie
  beim Champion) — Signature-Karten sind NIE als Chosen Champion wählbar,
  auch wenn `type === "unit"` und Tag passt (3 der 51 Signature-Karten im
  Datensatz sind Units).
- **Domain Identity, strikt**: jede Main-Deck-/Rune-Karte mit ≥1 Domain
  muss ALLE ihre Domains in der Legend-Domain-Liste haben (Teilmenge, nicht
  nur Überschneidung).

## Offene Punkte (bewusst nicht in v1 validiert)

- "Cards an effect adds to your deck ignoring Domain Identity count as
  in-identity" — Laufzeit-Regel für Effekte, die deckfremde Karten
  hinzufügen; für den Deckbauer selbst irrelevant (gilt erst im laufenden
  Spiel), nicht Teil der Deckbau-Validierung.
- Wie viele der 3 Battlefields im jeweiligen Spielmodus tatsächlich auf den
  Tisch kommen ("depends on the mode") ist nicht spezifiziert — wir nehmen
  weiterhin 2 aktive an (siehe `docs/rules-reference.md`), bis das geklärt
  ist.
