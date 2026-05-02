import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  const upload = multer({ storage: multer.memoryStorage() });

  // PDF Text Extraction
  app.post("/api/extract-pdf", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });
      const data = await pdf(req.file.buffer);
      res.json({ text: data.text });
    } catch (error: any) {
      console.error("PDF Extraction Error:", error);
      res.status(500).json({ error: "Failed to extract text from PDF" });
    }
  });

  // TMDB Proxy
  app.get("/api/tmdb/search", async (req, res) => {
    const { query } = req.query;
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: "TMDB_READ_ACCESS_TOKEN is not configured" });
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/search/multi`, {
        params: { query },
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      });
      const results = response.data.results.filter((i: any) => i.media_type === "movie" || i.media_type === "tv");
      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: "TMDB search failed" });
    }
  });

  app.get("/api/tmdb/external-ids", async (req, res) => {
    const { id, type } = req.query;
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: "TMDB_READ_ACCESS_TOKEN is not configured" });
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/${type}/${id}/external_ids`, {
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch external IDs" });
    }
  });

  app.get("/api/tmdb/find-by-imdb", async (req, res) => {
    const { imdbId } = req.query;
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: "TMDB_READ_ACCESS_TOKEN is not configured" });
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
        params: { external_source: "imdb_id" },
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      });
      const result = response.data.movie_results?.[0] || response.data.tv_results?.[0];
      if (result) {
        res.json({ title: result.title || result.name, tmdbId: result.id, type: result.media_type });
      } else {
        res.status(404).json({ error: "Not found on TMDB" });
      }
    } catch (error: any) {
      res.status(500).json({ error: "TMDB find failed" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(console.error);
