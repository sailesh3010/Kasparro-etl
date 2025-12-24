// src/etl/apiSource.ts
import axios from "axios";
import { query } from "../db";
import { normalize } from "../schemas/record";
import { v4 as uuidv4 } from "uuid";

/**
 * Fetch crypto prices from CoinGecko
 * Extract phase
 */
export async function fetchFromApi() {
  const coins = (process.env.CRYPTO_COINS || "bitcoin").split(",");

  const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
    params: {
      ids: coins.join(","),
      vs_currencies: "usd",
    },
  });

  // Transform CoinGecko response into pipeline-friendly records
  return Object.entries(res.data).map(([coin, data]: any) => ({
    id: coin,
    title: coin,
    description: `USD price: ${data.usd}`,
    price_usd: data.usd,
    published_at: new Date(),
    metadata: {
      provider: "coingecko",
      currency: "USD",
    },
  }));
}

/**
 * Load + Normalize phase
 */
export async function ingestApiItems(items: any[]) {
  let processed = 0;

  for (const raw of items) {
    // 1️⃣ Store raw payload (audit/debug)
    await query(
      `INSERT INTO raw_api (source_id, payload)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [raw.id ?? uuidv4(), raw]
    );

    // 2️⃣ Normalize into common schema
    const rec = normalize({
      source: "coingecko",
      source_id: raw.id,
      title: raw.title,
      description: raw.description,
      published_at: raw.published_at,
      metadata: raw.metadata,
    });

    // 3️⃣ Idempotent upsert
    await query(
      `INSERT INTO records
        (source, source_id, title, description, published_at, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (source, source_id)
       DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         published_at = EXCLUDED.published_at,
         metadata = records.metadata || EXCLUDED.metadata`,
      [
        rec.source,
        rec.source_id,
        rec.title,
        rec.description,
        rec.published_at,
        rec.metadata,
      ]
    );

    processed++;
  }

  return processed;
}
