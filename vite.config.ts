import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    react(),
    tanstackStart({
      server: {
        entry: "server",
      },
    }),
  ],
});
