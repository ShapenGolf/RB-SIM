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

- **80 Karten** vollständig generisch (nur printed Keywords).
- **63 Karten** automatisch als "Templated Effect" erkannt (Trigger + Aktion,
  z.B. "When you play me, draw 1.") und spielbar
  (`src/cards/data/templated-effects.json` + `src/game/templatedEffectEngine.ts`)
  — kein Code pro Karte nötig.
- **17 Karten** automatisch als "Activated Ability" erkannt ("[Kosten,]
  Exhaust: Effekt", inkl. Domain-Rune-Kosten) und spielbar
  (`src/cards/data/activated-abilities.json`).
- **6 Karten** von Hand implementiert (`src/cards/special-cases/`), Origins
  zuerst, der Reihe nach — siehe `src/cards/data/special-case-assignments.json`.
- Macht **166 von 1019 Karten (~16%) vollständig spielbar.**
- **853 Karten** noch offen (`src/cards/data/special-cases-todo.json`) — ihr
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

Wir arbeiten systematisch auf **volle Abdeckung aller Karten** hin (siehe
`docs/data-sourcing.md` für den aktuellen Stand und die Historie). Reihenfolge:

1. Verbleibende `special-cases-todo.json`-Einträge (853, Stand nach den
   ersten 6 Origins-Karten) der Reihe nach implementieren, Set für Set.
2. Mehrfach-Ziel-Auswahl und einfache Bedingungen als Erweiterung der
   Templated-Effect-Sprache (mehr Karten automatisch abdecken, bevor sie
   bespoke werden müssen).
3. Echte interaktive Ziel-Auswahl für Trigger, die aktuell nur automatisch
   den ersten gültigen Kandidaten wählen (onConquer/onHold/onAttack/
   onDefend/onMove/onDestroy).
4. "Equip"-Mechanik laufzeitseitig umsetzen (Anhängen an eine Einheit).
5. Handler für die noch fehlenden generischen Keywords ergänzen (Hidden,
   Ganking, Tank, Backline, Weaponmaster, Mighty, Predict als eigenständiger
   Hook — siehe Tabelle in `docs/rules-reference.md`).
6. Power-Domain bei den 41 mehrfarbigen Karten mit Power-Kosten verifizieren
   (aktuell geraten, siehe Warnungen von `scripts/import-cards.mjs`).
7. Online-Multiplayer: `Local()`-Transport in `src/ui/client.ts` durch
   `SocketIO({ server })` ersetzen, Server aufsetzen, auf Vercel deployen.
8. Chain/Priority-System für Reaction-Timing nachrüsten.
