import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  const host = true;

  return {
    server: {
      host,
      allowedHosts: ["app.dgws.dev", ".dgws.dev"],
      cors: {
        origin: [
          /^https?:\/\/app\.dgws\.dev$/,
          /^https?:\/\/[^.]+\.dgws\.dev$/,
        ],
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [
            // TC39 standard decorators (2023-11 / stage 3)
            ["@babel/plugin-proposal-decorators", { version: "2023-11" }],
          ],
        },
      }),
      VitePWA({
        // Use our hand-written service worker — vite-plugin-pwa compiles and
        // serves it correctly in both dev and production.
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
          // SW uses ESM imports — must be "module" in dev.
          type: "module",
        },
        // Our SW manages caching manually — skip workbox manifest injection.
        injectManifest: {
          injectionPoint: undefined,
        },
        // We already ship public/manifest.json — don't auto-generate one.
        manifest: false,
      }),
    ],
  };
});
