// frontend/vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,          // don't wipe Rust compiler errors
  server: {
    port: 5173,
    strictPort: true,          // fail loudly instead of hopping to 5174
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
