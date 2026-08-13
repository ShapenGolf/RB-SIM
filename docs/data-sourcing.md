# Kartendaten-Beschaffung

## Status (aktualisiert 2026-08-13)

**Import abgeschlossen.** Der Nutzer hat die offizielle Card-Gallery-JSON
(`https://riftbound.leagueoflegends.com/_next/data/<BUILD_ID>/en-us/card-gallery.json`)
manuell über den Browser gespeichert und hochgeladen (diese Sandbox blockiert
weiterhin ausgehenden Netzwerkzugriff auf fast alle Domains außer GitHub und
dem internen Such-Backend — automatisiertes Scraping war also weiterhin nicht
möglich, siehe unten). Die Datei enthielt **alle 5 bisher veröffentlichten
Sets** (nicht nur Vendetta, wie ursprünglich angenommen):

| Set | Code | Karten (dedupliziert) |
|---|---|---|
| Origins | OGN | 310 |
| Proving Grounds | OGS | 24 |
| Spiritforged | SFD | 251 |
| Unleashed | UNL | 238 |
| Vendetta | VEN | 196 |
| **Gesamt** | | **1019** (aus 1189 Roheinträgen, 170 Alt-Art/Showcase-Varianten dedupliziert) |

Import-Pipeline: `scripts/import-cards.mjs` → `src/cards/data/official-catalog.json`
(alle 1019 Karten, vollständige Metadaten) + `src/cards/data/special-cases-todo.json`
(Karten mit Text, der über die generische Keyword-Engine hinausgeht).

**Wichtiger Fund:** Die Mehrheit der Karten hat trotz Keyword-Tags auch
kartenspezifischen Fließtext (z.B. "When I hold, you score 1 point." — kein
Keyword, reiner Unique-Text). Von 1019 Karten sind **971 als Sonderfall
markiert**, nur 48 sind vollständig generisch abgedeckt. Das ist keine
Heuristik-Schwäche, sondern die tatsächliche Textur des Spiels: die
Zwei-Schichten-Architektur war genau für diesen Fall gedacht — Struktur zuerst
(Metadaten + Keyword-Erkennung für alle 1019 Karten funktioniert vollständig),
Sonderfälle priorisiert nachziehen statt alle 971 auf einmal zu implementieren.

## Frühere Sackgasse (archiviert)

Die folgenden Abschnitte beschreiben den ursprünglich geplanten automatisierten
Weg, der an der Netzwerk-Restriktion scheiterte, bevor der manuelle
Browser-Workaround (siehe Chat) erfolgreich war.

## Gefundene Quelle (für später / für den Nutzer)

Die offizielle Kartendatenbank wird von Riot als öffentliches Next.js-JSON
ausgeliefert (kein Auth nötig):

1. `GET https://riftbound.leagueoflegends.com/en-us/card-gallery/` – HTML,
   enthält die aktuelle Next.js Build-ID im Pattern
   `/_next/static/<BUILD_ID>/_buildManifest.js`.
2. `GET https://riftbound.leagueoflegends.com/_next/data/<BUILD_ID>/en-us/card-gallery.json`
   – liefert die komplette Kartendaten-Struktur
   (`pageProps.page.blades[2].cards.items`).

Ein Referenz-Implementierung dieses Fetches liegt öffentlich unter
[`vikkumar2021/RiftboundCardDatabase`](https://github.com/vikkumar2021/RiftboundCardDatabase)
(`fetch_cards.py`). Vereinfachtes Zielschema pro Karte (siehe README dort):

```json
{
  "id": "ogn-056-298",
  "name": "Adaptatron",
  "code": "OGN-056/298",
  "collector_number": 56,
  "set": "OGN",
  "set_name": "Origins",
  "type": "Unit",
  "rarity": "Uncommon",
  "domains": ["Calm"],
  "energy": 4,
  "might": 3,
  "power": null,
  "tags": ["Mech", "Piltover"],
  "ability_html": "...",
  "artists": ["Kudos Productions"]
}
```

## Was tatsächlich funktioniert hat

Weg 2 aus der ursprünglichen Liste: der Nutzer hat die rohe Card-Gallery-JSON
manuell über den Browser gespeichert (Seitenquelltext → Build-ID suchen →
`/_next/data/<BUILD_ID>/en-us/card-gallery.json` öffnen → Seite speichern) und
sie hier hochgeladen. `scripts/import-cards.mjs` hat daraus den kompletten
Katalog gebaut. Kein Environment-Netzwerkzugriff nötig.

## Import-Pipeline (`scripts/import-cards.mjs`)

```
node scripts/import-cards.mjs <raw-gallery.json> <output-catalog.json> <special-cases-todo.json>
```

Schritte:

1. Liest `pageProps.page.blades[2].cards.items` aus der Rohdaten-JSON.
2. Dedupliziert Alt-Art/Showcase-Varianten (gleiche Set+Collector-Nummer, nur
   Buchstaben-Suffix unterschiedlich, z.B. `OGN-121` vs. `OGN-121a`) — behält
   die Haupt-Printing.
3. Mappt Felder: `cardType.type[0].id` → unser `type` (Champions erkennbar an
   `cardType.superType` mit `id: "champion"`, sonst `type: "unit"`);
   `domain.values[].id` → `Domain`; `energy`/`might`/`power` → Zahlenwerte;
   `text.richText.body` (HTML) → Klartext, inkl. Umwandlung der
   Icon-Platzhalter (`:rb_might:`, `:rb_energy_2:`, `:rb_rune_fury:`, ...).
4. **Keyword-Extraktion:** Kartentext im offiziellen Datensatz markiert
   Keywords durchgängig in eckigen Klammern, z.B. `[Shield 2]`,
   `[Hunt 2] (When I conquer or hold, gain 2 XP.)`. Ein Regex erkennt bekannte
   Keyword-Namen (Liste in `KNOWN_KEYWORDS` im Script) + optionalen Zahlenwert
   und entfernt Tag + direkt angehängten Reminder-Text `(...)` gemeinsam.
5. Was danach an Fließtext übrig bleibt (> 3 Buchstaben), gilt als
   Unique-Effekt: die Karte landet in `special-cases-todo.json` statt
   automatisch (falsch) als "generisch abgedeckt" markiert zu werden.

## Ergebnis (Stand 2026-08-13)

- **1019 Karten** importiert, alle 5 Sets, in `src/cards/data/official-catalog.json`.
- **48 Karten** sind bereits vollständig generisch spielbar (nur printed
  Keywords, kein Unique-Text).
- **48 weitere Karten** wurden automatisch als "Templated Effect" erkannt
  (`src/cards/data/templated-effects.json`) — siehe
  `scripts/match-templated-effects.mjs` und den Abschnitt "Templated Effects"
  unten. Diese sind vollständig spielbar, ganz ohne Handschreiben von Code.
- **923 Karten** bleiben als Sonderfall in `src/cards/data/special-cases-todo.json`
  (Feld `residualText` zeigt den nicht abgedeckten Teil, `fullText` den
  kompletten Originaltext für die spätere Implementierung).
- 1 Karte (`ogn-16`, "Dangerous Duo") wurde manuell mit dem bereits
  existierenden `dangerous-duo`-Special-Case verknüpft (Text stimmt fast
  wörtlich überein) — siehe `IMPLEMENTED_SPECIAL_CASES` im Import-Script als
  Muster für weitere Verknüpfungen.

## Templated Effects — automatische Karteneffekt-Erkennung

`scripts/match-templated-effects.mjs` versucht, den `residualText` jeder
Sonderfall-Karte gegen eine kleine, streng geprüfte Menge von Trigger+Aktion-
Mustern zu matchen (z.B. "When you play me, draw 1." → Trigger `onPlay` +
Aktion `drawCards(1)`). Nur wenn der **gesamte** Resttext auf ein bekanntes
einfaches Muster passt, wird die Karte automatisch übernommen — Präzision vor
Trefferquote, im Zweifel bleibt eine Karte im manuellen Rückstand statt falsch
umgesetzt zu werden.

**Ergebnis nach mehreren Iterationsrunden:** 48 von 971 anfänglich
unklassifizierten Karten (~5%). Grund für die vergleichsweise niedrige Quote,
mit echten Daten belegt (siehe Analyse im Chat-Verlauf dieser Session):

- Die meisten Kartentexte kombinieren mehrere Klauseln/Bedingungen
  ("if...", "choose X. Then Y.", Pronomen-Verweise über Satzgrenzen) — ein
  präzisionsorientierter Matcher lehnt das bewusst ab, statt zu raten.
- **Gear (112 Karten)** und **Legend (93 Karten)** haben strukturell fast nie
  einfache Trigger-Effekte, sondern **aktivierte Fähigkeiten**
  ("Exhaust: Gib einer Einheit +2 Might") oder **statische Modifikatoren**
  ("Einheiten, die du kontrollierst, haben +1 Might im Angriff") — beides
  eigene Mechanik-Kategorien, die der Trigger-Matcher strukturell nicht
  abdecken kann.

Die 48 automatisch erkannten Karten laufen über einen generischen Interpreter
(`src/game/templatedEffectEngine.ts`), der ein festes Set von Aktions-
Primitiven ausführt: `buffMight`, `dealDamage`, `killTarget`, `recallTarget`,
`readyTarget`, `drawCards`, `discardCards`, `scorePoints`, `gainXP`,
`channelRunes`. Trigger-Hooks sind verdrahtet in `onPlay` (mit echter
Ziel-Auswahl-UI), `onConquer`, `onHold`, `onAttack`, `onDefend`,
`onAttackOrDefend`, `onMove`, `onDestroy`.

**Bekannte Einschränkung:** nur `onPlay` hat eine echte interaktive
Ziel-Auswahl (wiederverwendet die bestehende Spell-Target-UI). Alle anderen
Trigger wählen bei "choose"-Zielen deterministisch den ersten gültigen
Kandidaten — noch keine Spieler-Entscheidung. Das ist dokumentiert, nicht
versteckt; Ausbau zu echter Auswahl-UI ist ein separater nächster Schritt.

### Nächste Hebel für mehr Abdeckung (größer als weiteres Regex-Tuning)

1. **Aktivierte Fähigkeiten** ("Kosten, Exhaust: Effekt") als eigene
   generische Mechanik — neuer Move-Typ + Kosten-Zahlung + Wiederverwendung
   der Aktions-Primitive. Betrifft einen Großteil der 112 Gear-Karten.
2. **Statische Modifikatoren** ("Einheiten, die du kontrollierst, haben...")
   als eigener Matcher, analog zum Trigger-Matcher, aber für dauerhafte
   Board-weite Effekte statt einmalige Aktionen.
3. Mehrfach-Ziel-Auswahl ("give two friendly units each +2 Might") und
   einfache Bedingungen ("if you control 2+ gear, ...") als Erweiterung der
   Templated-Effect-Sprache.

## Bekannte Einschränkungen des Imports

- **Power-Domain bei mehrfarbigen Karten:** Das JSON gibt bei `power` nur eine
  Zahl an, keine Domain-Zuordnung. Bei Karten mit >1 Domain wurde die erste
  Domain geraten (41 betroffene Karten, alle mit Warnung beim Import-Lauf
  geloggt) — vor Verwendung im echten Deckbau gegen das Kartenbild verifizieren.
- **"Colorless"** ist als 7. Domain-Wert im Datensatz vorhanden (neutrale/
  domänenlose Karten, v.a. manche Battlefields/Gear) und wurde zu `Domain`
  in `src/cards/types.ts` hinzugefügt.
- Keyword-Erkennung ist Text-Pattern-Matching, kein echtes Parsing — bei
  ungewöhnlicher Formatierung können einzelne Keywords übersehen werden oder
  im `residualText` der Sonderfälle-Liste hängen bleiben.
- Die rohe 3,2-MB-Quelldatei wurde **nicht** ins Repo übernommen (nur das
  verarbeitete Ergebnis) — bei Bedarf (neue Sets, Errata) muss sie erneut
  besorgt und der Import erneut ausgeführt werden.
