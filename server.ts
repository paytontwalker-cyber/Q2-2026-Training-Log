import express from "express";
import path from "path";
import fs from "fs";

// Load environment variables for local dev if dotenv exists
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (e) {
  // dotenv not found, probably production
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add a health check endpoint for Cloud Run startup probe
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/healthz", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    // In dev, use Vite middleware
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Vite not found or failed to load. Are devDependencies installed?", e);
    }
  } else {
    // In production, serve the built dist directory
    const distPath = path.join(process.cwd(), "dist");
    
    // Check if dist exists. If not, it means the build failed or was not run.
    if (!fs.existsSync(distPath)) {
      console.error(`Dist directory not found at ${distPath}. Continuing anyway, but SPA will 404.`);
    }

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("index.html not found. App may not have been built correctly.");
      }
    });
  }

  // Bind to 0.0.0.0 so nginx sidecar or Cloud Run proxy can reach it
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
