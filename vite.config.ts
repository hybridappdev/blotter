import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5002,
    strictPort: true,
    cors: true,
    origin: "http://localhost:5002",
  },
});
