import dotenv from "dotenv";
import path from "path";
import express from "express";
import { registerRoutes } from "./routes";

// Hardcoded env vars from .env
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_g4BOXLHIw9uv@ep-super-dawn-ahjzzy2h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
process.env.DEBUG_SESSION_SECRET = "debug123";
// Load local env if present
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  try {
    const server = await registerRoutes(app);
    const port = Number(process.env.SMOKE_PORT || process.env.PORT || 5055);
    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`smoke API server listening on ${port}`);
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("failed to start smoke API server", e);
    process.exit(1);
  }
})();
