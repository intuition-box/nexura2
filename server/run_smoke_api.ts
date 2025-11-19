import dotenv from "dotenv";
import path from "path";
import express from "express";
import { registerRoutes } from "./routes";

// Load local env if present
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

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
