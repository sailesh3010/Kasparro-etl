// src/etl/runner.ts
import { query } from "../db";
import { fetchFromApi, ingestApiItems } from "./apiSource";
import { ingestCsvFile } from "./csvSource";
import { fetchRss, ingestRssItems } from "./rssSource";
import { v4 as uuidv4 } from "uuid";

const CSV_PATH = process.env.CSV_PATH || "/data/input.csv";
const RSS_URL = process.env.RSS_URL || "https://hnrss.org/frontpage";

/**
 * Checkpoint helpers
 */
async function getCheckpoint(source: string) {
  const res = await query(
    `SELECT last_synced_at FROM checkpoints WHERE source = $1`,
    [source]
  );
  return res.rows[0];
}

async function setCheckpoint(source: string, last_synced_at: Date) {
  await query(
    `INSERT INTO checkpoints (source, last_synced_at)
     VALUES ($1, $2)
     ON CONFLICT (source)
     DO UPDATE SET last_synced_at = EXCLUDED.last_synced_at`,
    [source, last_synced_at]
  );
}

/**
 * Single ETL execution
 */
export async function runETLOnce() {
  const runId = uuidv4();

  await query(
    `INSERT INTO etl_runs (id, status, started_at)
     VALUES ($1, $2, now())`,
    [runId, "running"]
  );

  try {
    /* -------------------- API SOURCE (CoinGecko) -------------------- */
    await getCheckpoint("coingecko"); // for audit only

    const apiItems = await fetchFromApi(); // no "since" for CoinGecko
    const apiProcessed = await ingestApiItems(apiItems || []);

    /* -------------------- CSV SOURCE -------------------- */
    const csvProcessed = await ingestCsvFile(CSV_PATH);

    /* -------------------- RSS SOURCE -------------------- */
    const rssItems = await fetchRss(RSS_URL);
    const rssProcessed = await ingestRssItems(rssItems || []);

    const total =
      (apiProcessed || 0) + (csvProcessed || 0) + (rssProcessed || 0);

    await query(
      `UPDATE etl_runs
       SET finished_at = now(),
           status = $1,
           processed_count = $2
       WHERE id = $3`,
      ["success", total, runId]
    );

    const now = new Date();
    await setCheckpoint("coingecko", now);
    await setCheckpoint("csv", now);
    await setCheckpoint("rss", now);

    return {
      runId,
      processed: {
        coingecko: apiProcessed,
        csv: csvProcessed,
        rss: rssProcessed,
      },
      total,
    };
  } catch (err: any) {
    await query(
      `UPDATE etl_runs
       SET finished_at = now(),
           status = $1,
           error = $2
       WHERE id = $3`,
      ["failed", String(err.message).slice(0, 1000), runId]
    );

    throw err;
  }
}
