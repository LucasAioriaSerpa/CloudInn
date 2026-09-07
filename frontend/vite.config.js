import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createRequire } from "module";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const { azureFunctionsMiddleware } = require("../backend/localBridge.cjs");

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "azure-functions-dev-server",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (
              req.url &&
              (req.url.startsWith("/api/") ||
                req.url.startsWith("/reservation") ||
                req.url.startsWith("/room") ||
                req.url.startsWith("/guest") ||
                req.url.startsWith("/health"))
            ) {
              return azureFunctionsMiddleware(req, res, next);
            }
            return next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
