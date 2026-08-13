# Riftbound Simulator (RB-SIM)

Browser-basierter 2-Spieler-Simulator für **Riftbound** (Riot Games TCG).
Privates Projekt — kein offizielles Riot-Produkt.

## Status

MVP-Architektur, lokal spielbar (Hotseat, ein Browser-Tab, zwei Panels).
Online-Multiplayer noch nicht aktiviert. Set 1 (Origins) ist **nicht
vollständig importiert** — siehe [`docs/data-sourcing.md`](docs/data-sourcing.md).

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

1. Volle Set-1-Kartendatenbank importieren (siehe `docs/data-sourcing.md`).
2. Automatische Sonderfälle-Erkennung beim Import (Keyword-Extraktion +
   Restfließtext-Erkennung).
3. Online-Multiplayer: `Local()`-Transport in `src/ui/client.ts` durch
   `SocketIO({ server })` ersetzen, Server aufsetzen, auf Vercel deployen.
4. Chain/Priority-System für Reaction-Timing nachrüsten.
