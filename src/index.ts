// src/index.ts
import { createApp } from "./server";
import { runETLOnce } from "./etl/runner";

const app = createApp();

// Cloud Run provides PORT=8080
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`API listening on port ${PORT}`);

  // Initial ETL run
  try {
    console.log("Starting initial ETL run...");
    await runETLOnce();
    console.log("Initial ETL completed");
  } catch (err) {
    console.error("Initial ETL failed:", err);
  }

  // Periodic ETL
  const intervalMin = Number(process.env.ETL_INTERVAL_MINUTES || 5);

  setInterval(async () => {
    console.log("Scheduled ETL run...");
    try {
      await runETLOnce();
      console.log("Scheduled ETL finished");
    } catch (err) {
      console.error("Scheduled ETL error:", err);
    }
  }, intervalMin * 60 * 1000);
});
