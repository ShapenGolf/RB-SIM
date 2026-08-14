import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works whether it's served from the domain root (local
  // preview) or a subpath (GitHub Pages project site, e.g. /RB-SIM/).
  base: "./",
  test: {
    globals: true,
    environment: "node",
  },
});
