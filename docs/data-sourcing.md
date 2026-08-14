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

## Ergebnis (Stand 2026-08-13, nach drei Ausbaustufen + erste Bespoke-Runde)

- **1019 Karten** importiert, alle 5 Sets, in `src/cards/data/official-catalog.json`.
- **80 Karten** vollständig generisch spielbar (nur printed Keywords, kein
  Unique-Text).
- **63 Karten** automatisch als "Templated Effect" erkannt
  (`src/cards/data/templated-effects.json`, `scripts/match-templated-effects.mjs`).
- **17 Karten** automatisch als "Activated Ability" erkannt, inkl.
  Domain-Rune-Kosten (`src/cards/data/activated-abilities.json`,
  `scripts/match-activated-abilities.mjs`).
- **346 Karten** von Hand implementiert, der Reihe nach ab Origins
  Collector-Nummer 1 (`src/cards/special-cases/`, zugeordnet in
  `src/cards/data/special-case-assignments.json` — bewusst getrennt von
  `official-catalog.json`, damit ein erneuter Import diese Arbeit nie
  überschreibt). Vollständige Liste dort; nicht mehr einzeln aufgezählt,
  da die Liste inzwischen zu lang für Prosa ist. Origins und Proving
  Grounds sind inzwischen fast vollständig auf bereits zurückgestellte
  Kategorien konzentriert (Hidden, Dual-Target, Move-Zähler,
  X-Kosten-Sprüche, Gegner-Entscheidungen, Tod-Ersatzeffekte, fehlende
  Champion Zone) — Spiritforged (SFD) läuft jetzt, ebenfalls der Reihe
  nach.
- **Equipment (Equip) und Weaponmaster neu implementiert:** eigenes
  Anlege-System (`CardInstance.equipment`/`attachedTo`,
  `game/equip.ts` `attachEquipment`, `equipGear`-Move, `Card.equipCost`
  aus dem Equip-Keyword-Text geparst für die gängigen Kostenmuster).
  Nebenbefund dabei: 34 der 40 SFD-Equipment-Karten galten bereits vor
  dieser Änderung als "generisch abgedeckt" (Equip war als Keyword
  erkannt, hatte aber keinen Handler) — sie waren also die ganze Zeit
  über lautlos wirkungslos, zählten aber schon zur generischen
  Abdeckungszahl mit. Jetzt funktionieren sie tatsächlich, ohne dass
  sich die Abdeckungszahl dadurch ändert. Offen bleibt weiterhin: der
  Equip-Kosten-Parser deckt nur "<Domain> Rune"/"N Energy+<Domain>
  Rune" ab (~32 von 53 Equip-Karten setübergreifend), Karten mit
  Zusatzklausel (z.B. "— Order Rune, Kill a friendly unit") brauchen
  eigene Sonderfälle; der Might-Bonus angehängter Ausrüstung ist laut
  Importdaten für alle Equipment-Karten `null`/0 (vermutlich
  Importer-Lücke). Das **[Repeat]-Keyword** (24 Karten) ist weiterhin
  nicht generisch implementiert — größere offene Einzelmechanik.
- Nebenbefund: Karten mit identischem Fließtext bei anderer
  Collector-Nummer (Reprints derselben Karte innerhalb eines Sets oder
  über Sets hinweg) lassen sich per Textvergleich gegen bereits
  zugewiesene Karten erkennen und ohne neuen Code direkt demselben
  Handler zuordnen — 6 Treffer bisher (u.a. Vayne/Darius/Yone-Reprints
  in SFD, Draven Showboat in VEN, Plundering Poro in UNL).
- Macht **506 von 1019 Karten (~50%) vollständig spielbar.**
- **513 Karten** bleiben als Sonderfall in `src/cards/data/special-cases-todo.json`.
- **Neues `additionalCostXPForReduction`-Cost-Bauteil** (Pendant zu
  `additionalCostDiscardForReduction`, aber zahlt aus dem Spieler-XP-Pool
  statt der Hand — Poppy, Defender of the Meek: "You may spend 3 XP as an
  additional cost to play me. If you do, I cost 3 Energy less.").
- **Hinweis zu drei Karten dieser Runde (Pridestalker, Bloodharbor Ripper,
  Wuju Master):** alle drei sind Kartentyp `legend` — die Legend-Zone ist
  laut früherem Fund weiterhin nicht ins Spielgeschehen verdrahtet
  (`buildMainDeck` schließt Legends vom Deckbau aus, kein Legend-Slot). Ihre
  Sonderfall-Handler sind trotzdem korrekt implementiert und einzeln
  testbar — sie greifen einfach erst, sobald die Legend-Zone selbst gebaut
  wird. Ein weiterer Reprint per Textvergleich gefunden: die zweite
  "Pridestalker"-Karte (unl-227) teilt sich denselben Handler wie unl-183.
- **`CardInstance.pendingSurviveCombatXP`** neu: XP, die eine andere Karte
  einer beliebigen Einheit "this turn" verspricht, falls sie eine Combat
  überlebt (Grim Resolve: "When it wins a combat this turn, gain 2 XP.") —
  ausgezahlt und zurückgesetzt direkt in `resolveCombat`s neuer
  Survivor-Schleife (siehe `onSurviveCombat` aus der letzten Runde), auch für
  Einheiten ohne eigenen `specialCaseId`.
- **Drei weitere kleine Hooks:** `onSurviveCombat` (feuert auf jede
  überlebende Einheit nach einem echten Showdown — vorher war "eine Combat
  gewinnen" als Ereignis nicht klar definierbar, Nidalees Reminder-Text "I
  win if I remain after combat" gibt jetzt eine eindeutige Definition vor);
  `onOpponentScored`, verdrahtet in `turnFlow.ts` `runBeginning` direkt nach
  der Punktevergabe (Sumpworks Map). `allowsPlayToEnemyOccupiedBattlefield`
  (bereits für Deadbloom Predator gebaut) jetzt auch für Rengar, Trophy
  Hunter wiederverwendet.
- **Engine-Bugfix (kein Special-Case, betrifft alle bisherigen Karten mit
  [Tank]/[Backline]):** `game/combat.ts`s `assignDamage` hat Ziele bisher
  stur in Array-Reihenfolge abgearbeitet — [Tank] ("zuerst zugewiesen") und
  [Backline] ("zuletzt zugewiesen") waren als Keywords zwar erkannt, aber die
  Zuweisungsreihenfolge wurde nie danach sortiert, also komplett wirkungslos.
  Betraf u.a. bereits committete Karten wie Xin Zhao, Vigilant / Galio,
  Indefatigable (Tank) und Enthusiastic Promoter / LeBlanc, Everywhere at
  Once (Backline). Jetzt sortiert `orderForDamageAssignment` die Ziele
  korrekt (Tank zuerst, Backline zuletzt, sonst stabile Originalreihenfolge),
  geprüft gegen printed UND `grantedThisTurn`-Keywords. Neue
  Combat-Tests bestätigen beide Fälle; alle bestehenden Tests blieben grün.
- Drei neue kleine Broadcast-/Query-Hooks dabei entstanden:
  `onDefend` (Pendant zu `onAttack` auf Einheiten-Ebene, für Yuumi, Magical
  Cat), `preventsCombatDamageForEnemy` (Aura-Variante von
  `preventsCombatDamage`, für Vilemaw), `onAllyTokenPlayed` (Broadcast direkt
  aus `token-helpers.ts`, da von Effekten erzeugte Tokens nie die
  `playCard`-Move durchlaufen und `onAllyCardPlayed` sie daher nie sieht —
  für Lillia, Protector of Dreams). Außerdem
  `PlayerState.maxEnergySpentOnSpellThisTurn` für "wenn du 4+ Energy für
  einen Spruch ausgegeben hast"-Karten (Prepared Neophyte).
- **Neuer `onEnemyCardPlayed`-Broadcast** (Gegenstück zu `onAllyCardPlayed`,
  gefeuert an das Board des GEGNERS des gerade spielenden Spielers, z.B. Vex,
  Apathetic: "When an opponent plays a unit while I'm at a battlefield,
  [Stun] it."). Dabei auch `CardInstance.statuses.cantMoveThisTurn` neu
  verdrahtet — `attackBattlefield` in `moves.ts` lehnt jetzt Ganking-Züge für
  so markierte Einheiten ab (folgt der bestehenden "ThisTurn"-Auto-Clear-
  Konvention).
- **Bugfix in `resolvePlayedCard` (moves.ts):** die Platzierung eines gespielten
  Units/Champions (Basis vs. Battlefield) geschah bisher NACH der
  `selfEntersReady`-Auswertung, sodass ein Handler nie `ctx.instance.zone`
  zuverlässig prüfen konnte, um "wenn zu einem Battlefield gespielt" zu
  erkennen. Jetzt wird zuerst platziert, danach ausgewertet — ermöglicht z.B.
  Shadow: "If you play me to a battlefield, I enter ready." Kein bestehender
  Handler hing vom alten Timing ab (geprüft), also reine Erweiterung ohne
  Verhaltensänderung für bereits implementierte Karten.
- **Zwei weitere kleine wiederverwendbare Hooks:** `preventsCombatDamage`
  (SpecialCase-Pendant zum bestehenden Keyword-Hook, z.B. Galio,
  Indefatigable: "I don't deal combat damage."); `preventsSelfReady`, jetzt in
  `turnFlow.ts` `runAwaken` abgefragt (z.B. Maduli the Gatekeeper: "I can't be
  readied.").
- **Zwei neue wiederverwendbare Cost-/Trigger-Bausteine:** ein
  `discardCount`-Feld für bespoke Activated Abilities ("Discard N, Exhaust:
  Effekt", z.B. Gutter Palace — zahlt über die bestehende
  `discardCardToTrash`-Senke, kein Kartenwahl-Choice, wie beim
  `recycleFromTrash`-Vorbild); ein `preventsTemporaryDeath`-Hook, den
  `killTemporaryInstances` jetzt vor jeder Temporary-Kill-Sweep abfragt (z.B.
  LeBlanc, Everywhere at Once: "Your [Temporary] effects at my battlefield
  don't trigger.").
- **Drittes Cost-Bauteil, `spendXP`:** bespoke Activated Abilities können jetzt
  auch "Spend N XP: Effekt" kosten (z.B. Crowd Favorite, Megatusk) — zahlt aus
  `CardInstance.xp` (dem Hunt/Level-Pool der Karte selbst, nicht dem
  Spieler-XP-Pool). Neuer `PlayerState.playedSpellThisTurn`-Flag für Crescent
  Guardian: "If you've played a spell this turn, ...". Ein weiterer Reprint
  per Textvergleich gefunden: Enthralling Protector (unl-162) = Crowd
  Favorite (unl-102), identischer Fließtext.
- **Nebenbefund/Bugfix beim Weiterscannen:** `GameState.turnPhase` wurde beim
  Setup einmalig auf `"main"` gesetzt und danach nie wieder aktualisiert —
  effektiv totes Feld, das die Beginning/Awaken/Channel/Draw-Phasen nie
  wirklich markierte. Betraf bereits zwei bestehende Karten stillschweigend
  (LeBlanc, Fragmented's "ziehe 2 statt 1 während der Beginning Phase" hat nie
  gegriffen; Ambush's `grantsReactionTiming`-Hook war dadurch immer `true`,
  wird aber an keiner Stelle im Movecode tatsächlich abgefragt, also folgenlos
  geblieben). Jetzt in `turnFlow.ts` an jedem Phasenübergang korrekt gesetzt.
  Neuer `PlayerState.friendlyUnitDiedDuringBeginningThisTurn`-Flag (gesetzt in
  `combat.ts` `destroyInstance`) baut direkt darauf auf, für Shadow Watcher:
  "Wenn eine verbündete Einheit während meiner Beginning Phase gestorben ist,
  betrete ich bereit."
- Spiritforged wird pausiert (Rest dominiert von [Repeat]), Unleashed
  läuft jetzt der Reihe nach — führt das **[Level N]-Keyword** ein
  (XP-Schwellenwert, war bereits als Keyword erkannt aber unbehandelt,
  jetzt analog zum bestehenden `hasConditionalGanking`-Override-Muster
  behandelt).
- **Zweite Unleashed-Runde (19 weitere Karten):** neue Infrastruktur dabei
  entstanden — `blocksScoringHere`/`blocksOpponentScoring`-Hooks für
  Battlefields, die das Punkten am Beginning-Step verhindern (z.B. Forgotten
  Monument: "kann nicht vor der dritten Runde punkten", dafür neuer
  `PlayerState.turnsTaken`-Zähler); `onConquerHere` um einen
  `excessDamage`-Parameter erweitert (z.B. Trapping Grounds: Bird-Token bei
  3+ überschüssigem Kampfschaden); neuer `onEveryBeginningPhase`-Hook für
  Battlefields, der bei jedem Spieler-Beginning feuert (nicht nur beim
  ersten); `dealDistributedDamage` gibt jetzt die zerstörten Instanz-IDs
  zurück (für Alpha Strike: "1 XP pro getöteter Einheit"). Dabei zwei weitere
  Bracket-Text-Fehlzuordnungen gefunden und gefixt (Sprite Queen, Petal
  Pixie — Erinnerungstext beschreibt erzeugte Tokens/andere Einheiten, wurde
  aber der Karte selbst als Keyword zugeordnet, siehe Kommentare in den
  jeweiligen `special-cases/*.ts`-Dateien).
- Einige Karten sind bewusst zurückgestellt statt implementiert, weil sie
  fehlende Engine-Mechaniken brauchen würden (dokumentiert statt stillschweigend
  übersprungen): Gegner-Entscheidungen ("unless"), Tod-Ersatzeffekte, ein
  Spell-Counter/Reaktionsfenster-System, nicht-Energy-Zusatzkosten (Domain-Rune,
  Unit exhausten), und das Hidden-Keyword (~50 Karten, verdeckt spielen +
  später aufdecken — größte offene Einzelmechanik).
- **Neu entdeckte Lücke:** Der Kartentyp `legend` (93 Karten, ~9% des Pools)
  ist bisher überhaupt nicht ins Spielgeschehen verdrahtet — kein Legend-Slot
  in `GameState`/`PlayerState`, keine Vorspiel-Auswahl, `buildMainDeck` schließt
  sie sogar explizit aus dem Deckbau aus. Das ist keine Special-Case-Lücke,
  sondern eine fehlende Subsystem (eigene Zone + Exhaust-Fähigkeiten-Engine),
  bewusst zurückgestellt statt einzeln als Sonderfall behandelt.
- Nebenbei einen weiteren Datenqualitäts-Fix gefunden: ein nackter
  Bracket-Tag ohne Zahl (`[Assault]`, `[Shield]`, `[Deflect]`) bedeutet
  laut Erinnerungstext auf vielen Karten konsistent "1", wurde aber bisher
  als wertlos (0) importiert. Jetzt korrekt mit `value: 1` befüllt.

### Neue generische Bausteine aus dieser Runde (wiederverwendbar für zukünftige Karten)

- **`grantedThisTurn`** auf `CardInstance`: Keywords, die einer Karte temporär
  von einer anderen verliehen werden (z.B. Cleave verleiht "Assault 3 this
  turn"), laufen automatisch durch dieselben Keyword-Hooks wie printed
  Keywords (`registry.ts` `contextsFor` berücksichtigt jetzt beides).
- **`othersEnterReady`**: statischer Hook für Karten wie Magma Wurm ("Other
  friendly units enter ready"), die das Standard-Verhalten "tritt exhausted
  ein" für andere eigene Karten außer Kraft setzen.
- **`onConquer`** als Special-Case-Hook (parallel zu Templated Effects) für
  Karten wie Adaptatron.
- **`attackingMightModifier` / `defendingMightModifier`** als Special-Case-
  Hooks für bedingte Might-Boni, die kein printed Keyword sind (z.B.
  Wielder of Water: "+2 Might solange ich allein bin").
- **`discardedCardThisTurn`** auf `PlayerState`, gesetzt vom generischen
  `discardCards`-Action-Primitive — Grundlage für Karten wie Raging Soul
  (siehe unten, aktuell noch nicht selbst umgesetzt).
- **`needsPlayTarget`** als deklaratives Flag auf `SpecialCaseHandler` statt
  einer von Hand gepflegten Liste in der UI — verhindert, dass eine neue
  Karte mit Ziel-Bedarf vergessen und dadurch beim Spielen still ohne Ziel
  ausgeführt wird.

### Wichtigster Fund dieser Runde: ein zweiter, größerer Daten-Bug

Die geplante dritte Mechanik ("statische Modifikatoren") stellte sich beim
Nachmessen als **kaum vorhanden** heraus: nur ~5 Karten im gesamten
Datensatz haben überhaupt die Form "Ich habe +X Might solange Y" oder
"Deine Einheiten haben +X Might" als vollständigen, eigenständigen Text —
zu wenig, um den Aufwand für eine neue generische Mechanik zu rechtfertigen.
Statt das trotzdem durchzuziehen, bin ich der Diskrepanz nachgegangen und
habe stattdessen etwas Wertvolleres gefunden: derselbe Bug-Typ wie beim
`[Empower]`-Fix (Kostentext zwischen Klammer-Tag und Erinnerungstext, den
der generische Stripper nicht erfasst) betraf **auch** `[Equip]`, `[Repeat]`
und `[Flow]` — vier verschiedene Keywords, nicht nur eins. Der verallgemeinerte
Fix (`COST_BEARING_KEYWORDS` in `scripts/import-cards.mjs`) hat allein **33
Karten** von Rauschen befreit, viele davon dadurch komplett generisch
spielbar geworden (z.B. Equip-Gear wie "Blighted Battleaxe", deren
kompletter Text nur noch aus dem Keyword + Kosten bestand).

Lehre daraus: bei diesem Datensatz bringt das Nachmessen einer Hypothese vor
dem Bauen der Mechanik regelmäßig mehr als das direkte Umsetzen — die zweite
"vielversprechende" Mechanik war es nicht, aber das genauere Hinsehen dabei
hat einen Bug gefunden, der mehr gebracht hat als die Mechanik selbst
gebracht hätte.

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

## Activated Abilities — "[Kosten,] Exhaust: Effekt"

`scripts/match-activated-abilities.mjs` erkennt die zweite große Mechanik-
Kategorie: eine vom Spieler bezahlte Fähigkeit statt eines automatischen
Triggers. v1-Umfang bewusst eng: nur reine Energy-Kosten + Erschöpfen der
Karte selbst (kein Domain/Rune-Kostenanteil, keine Opferkosten wie "Kill
this:"). Nutzt dieselben Aktions-Primitiven wie Templated Effects
(`src/game/templatedEffectEngine.ts` stellt dafür `runTemplatedActions`
gemeinsam bereit). Neuer Move `activateAbility` in `src/game/moves.ts`, mit
echter interaktiver Ziel-Auswahl in der UI (Aktivierung ist immer ein
expliziter Spielzug, genau wie `playCard`).

**Ergebnis:** 4 von den nach dem Trigger-Matcher verbliebenen ~920 Karten.
Deutlich weniger als erhofft — der Grund: die meisten "Exhaust:"-Texte haben
entweder einen Domain/Rune-Kostenanteil (v1 bewusst ausgeklammert) oder eine
mehrzeilige/mehrteilige Fähigkeit (z.B. zwei gestaffelte Effekte auf einer
Karte), beides bewusst nicht auto-gematcht statt falsch vereinfacht.

Nebenbei einen echten Datenqualitäts-Bug behoben: `[Empower] KOSTEN (KOSTEN:
Empower me...)` — die Aktivierungskosten für den Empowered-Status — wurden
vom ursprünglichen Import nicht als Einheit erkannt und verunreinigten den
Resttext vieler Karten mit "Empower"-Fähigkeit.

### Nächste Hebel für mehr Abdeckung (erledigt vs. offen)

1. ~~Domain/Rune-Kostenanteile bei Activated Abilities~~ — erledigt.
2. ~~Statische Modifikatoren als eigene Mechanik~~ — geprüft, verworfen:
   zu wenige Karten (~5) rechtfertigen keine neue Mechanik. Stattdessen den
   generalisierten Cost-Bearing-Keyword-Fix gebaut (siehe oben) — deutlich
   höherer Ertrag für ähnlichen Aufwand.
3. Mehrfach-Ziel-Auswahl ("give two friendly units each +2 Might") und
   einfache Bedingungen ("if you control 2+ gear, ...") als Erweiterung der
   Templated-Effect-Sprache.
4. Echte interaktive Ziel-Auswahl für die Trigger, die aktuell nur den ersten
   gültigen Kandidaten automatisch wählen (onConquer/onHold/onAttack/
   onDefend/onMove/onDestroy).
5. "Equip"-Mechanik selbst laufzeitseitig umsetzen (aktuell nur die
   Kosten/Text-Extraktion sauber, aber "an eine Einheit anhängen" ist noch
   keine echte Spielmechanik — siehe `activatedAbilityNeedsTarget`-Pendant
   für Equip als nächster Schritt).
6. Restliche 863 Sonderfälle priorisiert von Hand abarbeiten (siehe README
   "Nächste Schritte").

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
- **Kontextuelle Keyword-Erwähnungen werden fälschlich als eigene printed
  Keywords attribuiert.** Wenn eine Karte einer ANDEREN Karte/sich selbst
  bedingt ein Keyword verleiht (z.B. Raging Soul, ogn-19: "If you've
  discarded a card this turn, I have [Assault] and [Ganking]"), landet
  dieses Keyword unconditional in `card.keywords` — der Import kann nicht
  unterscheiden zwischen "diese Karte HAT das Keyword" und "diese Karte
  VERLEIHT das Keyword bedingt". Betrifft vermutlich mehrere Dutzend Karten
  mit ähnlichem Muster. Noch kein genereller Fix; betroffene Karten beim
  Bespoke-Implementieren einzeln behandeln (Raging Soul, ogn-19, ist deshalb
  aktuell übersprungen und bleibt korrekt in `special-cases-todo.json`
  stehen, statt fälschlich als erledigt markiert zu werden).
