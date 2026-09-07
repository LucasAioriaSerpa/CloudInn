import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export default defineConfig(({ command }) => {
  const plugins = [react(), tailwindcss()];

  // Attach local Azure Functions middleware ONLY during local development (vite dev/serve)
  if (command === "serve") {
    plugins.push({
      name: "azure-functions-dev-server",
      configureServer(server) {
        let middleware = null;
        try {
          const bridge = require("../backend/localBridge.cjs");
          middleware = bridge.azureFunctionsMiddleware;
        } catch (err) {
          console.warn(
            "[vite.config.js] Local Azure Functions bridge not loaded (dependencies not present or running in standalone mode):",
            err.message,
          );
        }

        if (middleware) {
          server.middlewares.use((req, res, next) => {
            if (
              req.url &&
              (req.url.startsWith("/api/") ||
                req.url.startsWith("/reservation") ||
                req.url.startsWith("/room") ||
                req.url.startsWith("/guest") ||
                req.url.startsWith("/health"))
            ) {
              middleware(req, res, next);
            } else {
              next();
            }
          });
        }
      },
    });
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, "./dist"),
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
