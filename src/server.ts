// src/server.ts
import express from "express";
import { getData } from "./services/dataService";
import { pool } from "./db";
import { runETLOnce } from "./etl/runner";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/data", async (req, res) => {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const q = req.query.q as string | undefined;
      const start = Date.now();
      const result = await getData({ page, limit, q });
      const apiLatency = Date.now() - start;
      res.json({
        ...result,
        meta: { ...result.meta, api_latency_ms: apiLatency },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      const lastRun = await pool.query(
        `SELECT * FROM etl_runs ORDER BY started_at DESC LIMIT 1`
      );
      res.json({ db: "ok", last_etl_run: lastRun.rows[0] ?? null });
    } catch (err: any) {
      res.status(500).json({ db: "down", error: err.message });
    }
  });

  app.get("/stats", async (req, res) => {
    try {
      const rows = (
        await pool.query(
          `SELECT source, COUNT(*) as count FROM etl_runs GROUP BY source`
        )
      ).rows;
      const runs = (
        await pool.query(
          `SELECT * FROM etl_runs ORDER BY started_at DESC LIMIT 10`
        )
      ).rows;
      res.json({ runs, summaries: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/", (req, res) => {
    res.json({
      service: "kasparro-etl",
      status: "running",
      endpoints: ["/health", "/data", "/stats", "/trigger-etl"],
    });
  });

  // Manual trigger (for testing)
  app.post("/trigger-etl", async (req, res) => {
    try {
      const result = await runETLOnce();
      res.json({ ok: true, result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return app;
}
