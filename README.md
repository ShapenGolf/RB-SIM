# Riftbound Simulator (RB-SIM)

Browser-basierter 2-Spieler-Simulator für **Riftbound** (Riot Games TCG).
Privates Projekt — kein offizielles Riot-Produkt.

## Status

MVP-Architektur, spielbar sowohl lokal (Hotseat, ein Browser-Tab, zwei
Panels) als auch **online über echte Netzwerkverbindung** (zwei Geräte/Orte,
siehe "Online-Multiplayer" unten).

**Visuelles UI (neu):** Karten werden jetzt als echte Kartenbilder gerendert
(`src/ui/CardFace.tsx`, `src/ui/cards.css`) statt als Text-Listen — Domain-
farbiger Rahmen, Kosten-/Might-/Power-Badges, Seltenheits-Indikator,
offizielle Artworks direkt von Riots CDN (`Card.imageUrl`, siehe
`docs/data-sourcing.md`). Das rohe boardgame.io-Debug-Panel ist standardmäßig
aus (`src/ui/client.ts`).

**Kartendatenbank: vollständig importiert**, alle 5 bisher erschienenen Sets
(1019 Karten: Origins, Proving Grounds, Spiritforged, Unleashed, Vendetta) —
siehe [`docs/data-sourcing.md`](docs/data-sourcing.md). Spielbarkeits-Stand
pro Karte:

- **80 Karten** vollständig generisch (nur printed Keywords).
- **63 Karten** automatisch als "Templated Effect" erkannt (Trigger + Aktion,
  z.B. "When you play me, draw 1.") und spielbar
  (`src/cards/data/templated-effects.json` + `src/game/templatedEffectEngine.ts`)
  — kein Code pro Karte nötig.
- **19 Karten** automatisch als "Activated Ability" erkannt ("[Kosten,]
  Exhaust: Effekt", inkl. Domain-Rune-Kosten) und spielbar
  (`src/cards/data/activated-abilities.json`).
- **858 Karten** von Hand implementiert (`src/cards/special-cases/`), alle 5
  Sets — siehe `src/cards/data/special-case-assignments.json`. Die restlichen
  Karten in `special-cases-todo.json` sind dokumentierte No-ops (jede
  verweist auf die konkrete fehlende Infrastruktur, die sie blockiert, z.B.
  Chain/Priority, [Add] oder [Hidden]).
- **Chosen Champion** hat jetzt eine echte eigene Zone (`PlayerState.championZone`
  in `game/state.ts`) statt einfach im Main Deck mitgemischt zu werden —
  spielbar sobald bezahlbar, unabhängig vom Kartenglück, sichtbar neben der
  Hand (für beide Spieler, da öffentliche Info). Dazu ein neuer generischer
  Engine-Baustein, `SpecialCaseEngine.onChosen` — broadcasted, sobald ein
  Spell/eine Activated Ability ein Ziel wählt — der mehrere vorher no-op
  Karten freigeschaltet hat (Jae Medarda, Hungry Wolf, Spirit Wheel, The
  Dreaming Tree, Hallowed Tomb, Swift Scout).
- **Equipment (Equip) und Weaponmaster** sind jetzt implementiert (eigenes
  Anlege-System: `equipGear`-Move, `game/equip.ts`, Weaponmaster-Keyword-
  Handler) — siehe `docs/rules-reference.md`.
- **[Tank]/[Backline] werden jetzt bei der Kampfschaden-Zuweisung
  berücksichtigt** (Tank zuerst, Backline zuletzt) — vorher waren beide
  Keywords zwar erkannt, aber komplett wirkungslos.
- Macht **860 von 1019 Karten vollständig spielbar** (zusammen mit
  Templated Effects/Activated Abilities). Die verbleibenden ~159 sind
  bewusste No-op-Registrierungen, keine offenen Lücken — Werte/Kosten/
  Keywords sind für alle 1019 Karten korrekt.

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
npm run dev      # Dev-Server, http://localhost:5173 — zwei Spieler-Panels nebeneinander (Hotseat)
npm run server   # Multiplayer-Server (Lobby + Spiel-Sync), http://localhost:8000, für Online-Modus
npm test         # Vitest-Suite
npm run build    # Produktions-Build
```

Kartendatenbank neu importieren (z.B. nach einem neuen Set-Release, siehe
`docs/data-sourcing.md` für die Beschaffung der Rohdaten):

```bash
node scripts/import-cards.mjs <raw-gallery.json> src/cards/data/official-catalog.json src/cards/data/special-cases-todo.json
```

## Online-Multiplayer

Echtes Spiel über zwei getrennte Geräte/Orte, nicht nur Hotseat im selben
Browser. Architektur:

- **`server/index.ts`** — ein boardgame.io-`Server()` (Koa + Socket.IO), der
  das Spiel hostet und die Lobby-REST-API (Raum erstellen/beitreten)
  bereitstellt. Startet lokal mit `npm run server` auf Port 8000
  (`PORT`-Env-Var überschreibbar, `ALLOWED_ORIGIN` für zusätzliche CORS-
  Origins bei Produktions-Deployments).
- **Client** verbindet sich per `SocketIO({ server })`-Transport
  (`src/ui/OnlineGame.tsx`) statt des lokalen `Local()`-Transports
  (`src/ui/client.ts`, weiterhin für Hotseat genutzt).
- **Lobby-UI** (`src/ui/Lobby.tsx`, `src/ui/onlineLobby.ts`): Server-Adresse
  eingeben (wird lokal gespeichert), Raum erstellen → Raum-Code teilen, oder
  mit Raum-Code beitreten.
- **Deck-Übermittlung**: Da jedes Deck im `localStorage` des jeweiligen
  Browsers liegt (nicht beim Server bekannt), gibt es eine eigene
  `deckSelect`-Phase zu Spielbeginn — jeder Spieler wählt sein gespeichertes
  Deck direkt im laufenden Match. Für lokales Hotseat ist diese Phase
  unsichtbar (beide Decks sind sofort bekannt, die Phase überspringt sich
  selbst).

**Deployment:** Der einzige manuelle Schritt ist, `server/index.ts` einmal
irgendwo dauerhaft laufen zu lassen (Node-Hosting mit Websocket-Support,
z.B. [Render](https://render.com) — kostenloser Tier reicht). Mit
angeschlossenem GitHub-Repo: "New Web Service" → dieses Repo auswählen →
Render erkennt `render.yaml` automatisch (Build: `npm install`, Start:
`npm run server:start`). Danach in der App unter "Online spielen" die
öffentliche Server-URL eintragen (oder per `VITE_SERVER_URL` beim
Frontend-Build vorbelegen) — das war's, kein weiterer Code nötig.
Bekannte Einschränkung: Matches liegen nur im Server-RAM (kein
`StorageAPI` konfiguriert) — ein Server-Neustart/Idle-Sleep verliert
laufende Partien.

## Bekannte MVP-Vereinfachungen

Diese Punkte sind bewusste Vereinfachungen für die erste Architektur-
Validierung, nicht vollständig gegen die offiziellen Turnierregeln
verifiziert (siehe Kommentare im jeweiligen Code):

- Kein volles Chain/Priority-System (Reaction-Fenster im gegnerischen Zug
  fehlen); Karten werden nur in der eigenen Main-Phase gespielt.
- [Add] (generische Ressourcen-Erzeugung über den Rune-Pool hinaus) ist als
  Keyword erkannt, aber ohne Laufzeit-Effekt.
- [Hidden] ist implementiert, aber vereinfacht: verdeckte Karten liegen in
  einer privaten Liste statt physisch auf einem Battlefield-Slot (siehe
  "Nächste Schritte" unten).
- Kampf wird als simultane Schadenszuteilung behandelt (Annahme, nicht aus
  offiziellem Text bestätigt — siehe Kommentar in `src/game/combat.ts`).
- Starthandgröße (7) ist ein Standard-TCG-Wert, keine bestätigte
  Riftbound-Regel.
- Deckbau fürs lokale Testspiel zykelt einfach durch den Starter-Set-Pool
  statt echte 40-Karten-Decklisten zu verwenden (`src/game/setup.ts`).

## Nächste Schritte

Card-Coverage ist abgeschlossen (860/1019, Rest sind dokumentierte No-ops)
und Online-Multiplayer steht (siehe oben). Kleinere, in sich abgeschlossene
No-op-Karten werden weiter opportunistisch nachgezogen, sobald sich ein
neuer generischer Engine-Baustein lohnt (siehe z.B. `onChosen` oben).

**[Hidden]** (verdeckt spielen, später kostenlos aufdecken) ist jetzt
implementiert — `PlayerState.hiddenZone`, `moves.ts`'s `hideCard`/
`playFromHidden`, siehe Commit-Historie. Bewusste Vereinfachung: die
verdeckte Karte liegt in einer privaten Liste (wie die Hand), nicht
physisch auf einem Battlefield-Slot — für Karten, deren Text genau das
abfragt ("kontrollierst du eine verdeckte Karte AN EINEM Battlefield"),
bleibt es beim No-op (Mushroom Pouch, Noxus Saboteur, Bandle Tree, Bone
Skewer). "Verdeckt" ist außerdem nur so vertrauenswürdig wie die Hand
heute schon ist — technisch im Spielzustand sichtbar, nur in der
Oberfläche verborgen (siehe Punkt 2 unten, auf ausdrücklichen Nutzerwunsch
bewusst so entschieden, da nur unter Freunden gespielt wird).

Die zwei größten verbleibenden Blocker brauchen jeweils eine echte neue
Subsystem-Investition, keinen kleinen Chokepoint-Fix:

1. **Chain/Priority-System** für Reaction-Timing/Counter — blockiert **9
   Karten**, die nur im gegnerischen Zug reagieren oder Spells kontern.
2. **[Add]** (generische Ressourcen-Erzeugung über den Rune-Pool hinaus) —
   blockiert noch **8 Karten**. Die restriktionslosen "Exhaust: [Add] 1
   Energy"-Fälle (Dragonsoul Sage, Energy Conduit) laufen inzwischen über
   den bestehenden `gainRune`-Mechanismus (wie die 12 Seal-of-*-Karten);
   offen bleiben nur noch Varianten mit Nutzungsbeschränkung ("nur für
   Spells/Gear/Showdowns"), Bedingungen ([Legion]/[Level]) oder variabler
   Menge ("pay any amount ... to add that much").

Weitere offene Punkte:

3. Hidden Information: Handkarten/Deck/verdeckte Karten des Gegners im UI
   *kryptografisch* verbergen (wichtig für kompetitiveres Online-Spiel —
   aktuell sieht jede Client-Instanz den vollen Spielzustand beider
   Spieler, siehe boardgame.io `playerView`). Für Spiele unter Freunden
   (aktueller Nutzungskontext) explizit zurückgestellt.
4. Echte interaktive Ziel-Auswahl für Trigger, die aktuell nur automatisch
   den ersten gültigen Kandidaten wählen (onConquer/onHold/onAttack/
   onDefend/onMove/onDestroy).
5. Power-Domain bei den 41 mehrfarbigen Karten mit Power-Kosten verifizieren
   (aktuell geraten, siehe Warnungen von `scripts/import-cards.mjs`).
6. Persistenter `StorageAPI` für den Multiplayer-Server (statt In-Memory),
   damit laufende Partien einen Server-Neustart überleben.
7. Drag & Drop auf Touch-Geräten (aktuell nur Desktop-Maus, siehe HTML5-DnD
   in `src/ui/Board.tsx`).
