import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    // Disable HMR socket attachment to the main HTTP server to avoid
    // platform-specific WebSocket frame errors (e.g. invalid status codes).
    // This will disable hot-module-reload but keeps vite middleware working.
    hmr: false,
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Serve index.html for all other routes but inject a runtime BACKEND URL
  // so the client can be configured at request time without rebuilding.
  app.use("*", (req, res) => {
    const indexFile = path.resolve(distPath, "index.html");
    try {
      let html = fs.readFileSync(indexFile, "utf8");

      // Determine backend URL to inject. Prefer explicit env var, otherwise
      // derive from the incoming request origin (protocol + host).
      // Prefer explicit env var, otherwise fall back to the user-provided API host.
      // If neither is set, infer from the request origin.
      const envUrl = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL;
      const inferred = `${req.protocol}://${req.get("host")}`;
      // User-provided fallback (set to production API if desired).
      // Prefer an inferred backend URL derived from the incoming request so
      // static files served on the same host will talk to the correct API.
      // Do not hard-code a localhost fallback here; if nothing is provided we
      // will inject an empty string and let the client decide (relative requests).
      const userFallback = "";
      const backendUrl = envUrl || inferred || userFallback;

      const script = `<script>window.__BACKEND_URL__ = ${JSON.stringify(
        backendUrl,
      )};</script>`;

      // Inject before closing </head> if present, otherwise prepend.
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${script}\n</head>`);
      } else {
        html = script + html;
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      console.error("serveStatic: failed to read/serve index.html", e);
      res.status(500).send("Internal Server Error");
    }
  });
}
