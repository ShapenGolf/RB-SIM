# Riftbound Simulator (RB-SIM)

Browser-basierter 2-Spieler-Simulator für **Riftbound** (Riot Games TCG).
Privates Projekt — kein offizielles Riot-Produkt.

## Status

MVP-Architektur, lokal spielbar (Hotseat, ein Browser-Tab, zwei Panels).
Online-Multiplayer noch nicht aktiviert.

**Kartendatenbank: vollständig importiert**, alle 5 bisher erschienenen Sets
(1019 Karten: Origins, Proving Grounds, Spiritforged, Unleashed, Vendetta) —
siehe [`docs/data-sourcing.md`](docs/data-sourcing.md). Spielbarkeits-Stand
pro Karte:

- **48 Karten** vollständig generisch (nur printed Keywords).
- **48 Karten** automatisch als "Templated Effect" erkannt und spielbar
  (`src/cards/data/templated-effects.json` + `src/game/templatedEffectEngine.ts`)
  — kein Code pro Karte nötig.
- **923 Karten** noch offen (`src/cards/data/special-cases-todo.json`) — ihr
  Unique-Effekt tut noch nichts, bis ein Special-Case-Handler dafür existiert.
  Werte/Kosten/Keywords sind aber für alle 1019 Karten korrekt.

Ziel ist volle Abdeckung aller Karten und Interaktionen — das ist ein großer,
aber mechanischer Rückstand, der systematisch abgearbeitet wird (siehe
"Nächste Schritte" unten für die aktuelle Priorität).

## Architektur

Zwei-Schichten-Modell:

1. **Generische Keyword-Engine** (`src/keywords/`) — ein Handler pro Keyword
   (Stun, Empowered, Ambush, Hunt, Accelerate, Assault, Deflect, Legion,
   Shield, Deathknell, Vision). Karten referenzieren Keywords nur per Name +
   Parameter (`src/cards/types.ts`), ohne eigenen Code.
2. **Special Cases** (`src/cards/special-cases/`) — kleine, dedizierte
   Handler für Karten mit echtem Unique-Text (aktuell 6 Beispiele: Dangerous
   Duo, Doomed Recruit, Stunning Blow, Empowered Champion, Tactical Banner,
   Ancient Ruins).

Weitere Doku:
- [`docs/rules-reference.md`](docs/rules-reference.md) — recherchierte
  Regeln (Zonen, Zugstruktur, Ressourcen, Kampf, Keyword-Glossar).
- [`docs/data-sourcing.md`](docs/data-sourcing.md) — Stand der
  Kartendatenbank-Beschaffung und wie es weitergeht.

## Setup

```bash
npm install
npm run dev      # Dev-Server, http://localhost:5173 — zwei Spieler-Panels nebeneinander
npm test         # Vitest-Suite (32 Tests: Keywords, Special Cases, Combat, Turn Flow)
npm run build    # Produktions-Build
```

Kartendatenbank neu importieren (z.B. nach einem neuen Set-Release, siehe
`docs/data-sourcing.md` für die Beschaffung der Rohdaten):

```bash
node scripts/import-cards.mjs <raw-gallery.json> src/cards/data/official-catalog.json src/cards/data/special-cases-todo.json
```

## Bekannte MVP-Vereinfachungen

Diese Punkte sind bewusste Vereinfachungen für die erste Architektur-
Validierung, nicht vollständig gegen die offiziellen Turnierregeln
verifiziert (siehe Kommentare im jeweiligen Code):

- Kein volles Chain/Priority-System (Reaction-Fenster im gegnerischen Zug
  fehlen); Karten werden nur in der eigenen Main-Phase gespielt.
- Champion Zone nicht separat modelliert — Champions verhalten sich wie
  normale Units.
- Kampf wird als simultane Schadenszuteilung behandelt (Annahme, nicht aus
  offiziellem Text bestätigt — siehe Kommentar in `src/game/combat.ts`).
- Starthandgröße (7) ist ein Standard-TCG-Wert, keine bestätigte
  Riftbound-Regel.
- Deckbau fürs lokale Testspiel zykelt einfach durch den Starter-Set-Pool
  statt echte 40-Karten-Decklisten zu verwenden (`src/game/setup.ts`).

## Nächste Schritte

1. **Aktivierte Fähigkeiten** ("Kosten, Exhaust: Effekt") als generische
   Mechanik ergänzen — größter Hebel für weitere automatische Abdeckung,
   betrifft einen Großteil der 112 Gear-Karten (siehe
   `docs/data-sourcing.md`, Abschnitt "Nächste Hebel").
2. **Statische Modifikatoren** ("Einheiten, die du kontrollierst, haben...")
   als eigener Matcher, analog zu Templated Effects.
3. Verbleibende `special-cases-todo.json`-Einträge (923) priorisiert
   bespoke implementieren — nach Set, Deck-Archetyp, oder was du mit
   Freunden tatsächlich spielen willst.
4. Handler für die noch fehlenden generischen Keywords ergänzen (Hidden,
   Equip, Empower, Ganking, Tank, Backline, Weaponmaster, Flow, Repeat,
   Mighty, Buff, Predict als eigenständiger Hook — siehe Tabelle in
   `docs/rules-reference.md`).
5. Power-Domain bei den 41 mehrfarbigen Karten mit Power-Kosten verifizieren
   (aktuell geraten, siehe Warnungen von `scripts/import-cards.mjs`).
6. Online-Multiplayer: `Local()`-Transport in `src/ui/client.ts` durch
   `SocketIO({ server })` ersetzen, Server aufsetzen, auf Vercel deployen.
7. Chain/Priority-System für Reaction-Timing nachrüsten.
