/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default multiplayer server URL baked in at build time — overridable per-browser (see ui/onlineLobby.ts's saved-server-URL, which always wins if set). */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
