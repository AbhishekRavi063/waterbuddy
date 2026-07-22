import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "icons/amrita.jpg"],
      manifest: {
        name: "Water Buddy",
        short_name: "Water Buddy",
        description:
          "Funny hydration reminders with random characters in English, Hindi, and Malayalam.",
        theme_color: "#ff8c42",
        background_color: "#fff7ed",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
