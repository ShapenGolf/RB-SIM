import { RiftboundClient } from "./client";

const MATCH_ID = "local-hotseat";

export function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
      <div style={{ flex: 1, borderRight: "2px solid #333" }}>
        <RiftboundClient playerID="0" matchID={MATCH_ID} />
      </div>
      <div style={{ flex: 1 }}>
        <RiftboundClient playerID="1" matchID={MATCH_ID} />
      </div>
    </div>
  );
}
