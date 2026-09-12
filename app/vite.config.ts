import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Alias workspace packages straight to their TS source instead of their
// built `dist/`, so editing hooks/lib/canvas/utils/createZustandContext
// hot-reloads immediately without a separate `tsc` rebuild step.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@infinite-canvas/hooks": fileURLToPath(
        new URL("../hooks/index.tsx", import.meta.url)
      ),
      "@infinite-canvas/canvas": fileURLToPath(
        new URL("../lib/canvas/index.tsx", import.meta.url)
      ),
      "@infinite-canvas/utils": fileURLToPath(
        new URL("../utils/index.tsx", import.meta.url)
      ),
      "@infinite-canvas/createZustandContext": fileURLToPath(
        new URL("../lib/createZustandContext/index.tsx", import.meta.url)
      ),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
  },
});
