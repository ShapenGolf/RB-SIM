import { useState } from "react";
import { RiftboundClient } from "./client";
import { DeckBuilder } from "./DeckBuilder";
import { Menu } from "./Menu";
import { setPendingSetupOptions } from "../game/pendingSetup";
import type { SetupOptions } from "../game/setup";
import "./cards.css";

type View = { screen: "menu" } | { screen: "deckbuilder" } | { screen: "game"; matchId: string };

export function App() {
  const [view, setView] = useState<View>({ screen: "menu" });

  function startGame(options: SetupOptions) {
    setPendingSetupOptions(options);
    setView({ screen: "game", matchId: `local-${Date.now()}` });
  }

  if (view.screen === "deckbuilder") {
    return (
      <div className="rb-page">
        <DeckBuilder onExit={() => setView({ screen: "menu" })} />
      </div>
    );
  }

  if (view.screen === "game") {
    return (
      <div className="rb-app">
        <button className="rb-exit-game" onClick={() => setView({ screen: "menu" })}>
          ← Menü
        </button>
        <div className="rb-panel">
          <RiftboundClient playerID="0" matchID={view.matchId} />
        </div>
        <div className="rb-panel">
          <RiftboundClient playerID="1" matchID={view.matchId} />
        </div>
      </div>
    );
  }

  return (
    <div className="rb-page">
      <Menu onOpenDeckBuilder={() => setView({ screen: "deckbuilder" })} onStartGame={startGame} />
    </div>
  );
}
