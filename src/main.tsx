import { createRoot } from "react-dom/client";
import { App } from "./ui/App";

// No React.StrictMode: it double-invokes mount effects in dev, which
// double-fires boardgame.io's Local transport connection and causes the
// turn-start sequence (Awaken/Beginning/Channel/Draw) to run twice.
createRoot(document.getElementById("root")!).render(<App />);
