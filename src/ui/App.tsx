import { RiftboundClient } from "./client";
import "./cards.css";

const MATCH_ID = "local-hotseat";

export function App() {
  return (
    <div className="rb-app">
      <div className="rb-panel">
        <RiftboundClient playerID="0" matchID={MATCH_ID} />
      </div>
      <div className="rb-panel">
        <RiftboundClient playerID="1" matchID={MATCH_ID} />
      </div>
    </div>
  );
}
