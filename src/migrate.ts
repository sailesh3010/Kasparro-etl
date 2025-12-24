import fs from "fs";
import path from "path";
import { pool } from "./db";

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

async function waitForDb() {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("Database is ready");
      return;
    } catch (err) {
      console.log(`DB not ready (attempt ${i}/${MAX_RETRIES}), retrying...`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    }
  }
  throw new Error("Database not ready after retries");
}

async function runMigrations() {
  console.log("Waiting for DB...");
  await waitForDb();

  console.log("Running DB migrations...");
  const sqlPath = path.join(__dirname, "../migrations/init.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  await pool.query(sql);

  console.log("Migrations completed successfully");
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
