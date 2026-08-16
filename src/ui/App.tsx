import { useState } from "react";
import { RiftboundClient } from "./client";
import { DeckBuilder } from "./DeckBuilder";
import { Menu } from "./Menu";
import { Lobby } from "./Lobby";
import { OnlineGame } from "./OnlineGame";
import { setPendingSetupOptions } from "../game/pendingSetup";
import type { SetupOptions } from "../game/setup";
import { loadOnlineSession, saveOnlineSession, clearOnlineSession, leaveMatch, type OnlineSession } from "./onlineLobby";
import "./cards.css";

type View =
  | { screen: "menu" }
  | { screen: "deckbuilder" }
  | { screen: "game"; matchId: string }
  | { screen: "lobby" }
  | { screen: "online"; session: OnlineSession };

export function App() {
  const [view, setView] = useState<View>(() => {
    const restored = loadOnlineSession();
    return restored ? { screen: "online", session: restored } : { screen: "menu" };
  });

  function startGame(options: SetupOptions) {
    setPendingSetupOptions(options);
    setView({ screen: "game", matchId: `local-${Date.now()}` });
  }

  function joinedOnline(session: OnlineSession) {
    saveOnlineSession(session);
    setView({ screen: "online", session });
  }

  function exitOnline(session: OnlineSession) {
    clearOnlineSession();
    void leaveMatch(session);
    setView({ screen: "menu" });
  }

  if (view.screen === "deckbuilder") {
    return (
      <div className="rb-page">
        <DeckBuilder onExit={() => setView({ screen: "menu" })} />
      </div>
    );
  }

  if (view.screen === "lobby") {
    return (
      <div className="rb-page">
        <Lobby onJoined={joinedOnline} onCancel={() => setView({ screen: "menu" })} />
      </div>
    );
  }

  if (view.screen === "online") {
    return (
      <div className="rb-app">
        <button className="rb-exit-game" onClick={() => exitOnline(view.session)}>
          ← Menü
        </button>
        <div className="rb-room-code">
          Raum-Code: <strong>{view.session.matchID}</strong>
        </div>
        <div className="rb-panel">
          <OnlineGame {...view.session} />
        </div>
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
      <Menu
        onOpenDeckBuilder={() => setView({ screen: "deckbuilder" })}
        onStartGame={startGame}
        onOpenLobby={() => setView({ screen: "lobby" })}
      />
    </div>
  );
}
