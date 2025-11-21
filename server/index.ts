import dotenv from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";

// Load local env file if present. This intentionally reads `.env.local` so
// developers can keep per-machine settings. The file is tracked per your
// request (not ignored) so replace placeholder values with real secrets.
try {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
} catch (e) {
  // ignore if dotenv not available or fails
}
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

  // Session middleware: prefer a persistent store when DATABASE_URL is provided.
  // This enables server-side sessions (cookie-based) for production deployments
  // such as Render. The session cookie is Secure in production and uses a
  // server-side store backed by Postgres via connect-pg-simple when available.
  const SESSION_SECRET = process.env.SESSION_SECRET || process.env.SECRET || "replace-me";
  const pgConnection = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING || null;
  const PgSession = connectPgSimple(session as any);
  let sessionStore: any = undefined;

  try {
    if (pgConnection) {
      const pgPool = new pg.Pool({ connectionString: pgConnection });
      sessionStore = new PgSession({ pool: pgPool });
    }
  } catch (e) {
    console.warn("Failed to initialize Postgres session store, falling back to in-memory store", e);
    sessionStore = undefined;
  }

  app.use(
    session({
      store: sessionStore,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    }) as any,
  );

// CORS: do not use cookies or credentialed requests. The API uses Authorization: Bearer <token>
// Allow cross-origin requests but do NOT advertise support for credentials/cookies.
app.use((req, res, next) => {
  // CORS configuration. In production, prefer an explicit FRONTEND_URL so we
  // can enable credentialed cookie-based sessions. In development we allow
  // any origin to simplify testing (no credentials).
  const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || null;
  if (process.env.NODE_ENV === 'production' && FRONTEND_URL) {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

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

      log(logLine);
    }
  });

  next();
});

// Serve attached_assets before the catch-all route
app.use("/attached_assets", express.static(path.resolve(import.meta.dirname, "..", "attached_assets")));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

(async () => {
  try {
    const server = await registerRoutes(app);

    // Seed tasks on server start (in development)
    if (app.get("env") === "development") {
      try {
        const { seedTasks } = await import("./seedTasks");
        await seedTasks();
        log("✓ Tasks seeded successfully");
      } catch (error) {
        log("⚠ Failed to seed tasks:", error);
      }
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Express error handler:', err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Render and other cloud platforms use the PORT environment variable
    // Default to 5051 for local development
    const port = parseInt(process.env.PORT || '5051', 10);
    const host = process.env.HOST || "0.0.0.0";
    
    // `reusePort` is not supported on some platforms (notably Windows). Only set it when
    // the platform looks like a Unix-like environment.
    const listenOptions: any = { port, host };
    if (process.platform !== "win32") {
      listenOptions.reusePort = true;
    }

    server.listen(listenOptions, () => {
      log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      log(`🌐 Listening on ${host}:${port}`);
      log(`📊 Health check: http://${host === "0.0.0.0" ? "localhost" : host}:${port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
