// Load environment variables as early as possible.
// Use DOTENV_CONFIG_PATH to point to a specific file (e.g. .env.local) when running locally.
import 'dotenv/config';
import { createRequire } from 'module';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as logger from './logger'

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS for bearer-token auth
app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); if (req.method === 'OPTIONS') return res.status(204).end(); next(); });

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      logger.info(logLine, { method: req.method, path, status: res.statusCode, duration })
    }
  });

  next();
});

app.use("/attached_assets", express.static(path.resolve(import.meta.dirname, "..", "attached_assets")));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

export async function startServer() {
  try {
    const server = await registerRoutes(app);

    // Seed tasks only when explicitly requested via SEED_ON_START.
    // For production deployments we do NOT seed by default.
    // To seed in a local/dev run set SEED_ON_START=true in your environment.
    if (String(process.env.SEED_ON_START || '').toLowerCase() === 'true') {
      try {
        const { seedTasks } = await import("./seedTasks");
        await seedTasks();
        logger.info("Tasks seeded successfully");
      } catch (error) {
        logger.error("Failed to seed tasks: " + String(error));
      }
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      logger.error('Express error handler', { err: String(err) });
    });

    // Setup vite in development
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = parseInt(process.env.PORT || '5051', 10);
    const host = process.env.HOST || "0.0.0.0";
    // reusePort used on unix-like platforms
    const listenOptions: any = { port, host };
    if (process.platform !== "win32") {
      listenOptions.reusePort = true;
    }

    server.listen(listenOptions, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Listening on ${host}:${port}`);
      logger.info(`Health check: http://${host === "0.0.0.0" ? "localhost" : host}:${port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// If this module is executed directly (e.g. `tsx server/index.ts`), start the server.
// In ESM, we can detect this by comparing import.meta.url to the process argv entry.
try {
  if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
    // running directly
    startServer();
  }
} catch (e) {
  // ignore detection errors in unusual environments
}
