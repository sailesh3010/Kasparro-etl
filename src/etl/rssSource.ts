// src/etl/rssSource.ts
import Parser from "rss-parser";
import { query } from "../db";
import { normalize } from "../schemas/record";
import { v4 as uuidv4 } from "uuid";

const parser = new Parser();

export async function fetchRss(url: string) {
  const feed = await parser.parseURL(url);
  return feed.items || [];
}

export async function ingestRssItems(items: any[]) {
  let processed = 0;
  for (const item of items) {
    await query(`INSERT INTO raw_rss (source_id, payload) VALUES ($1, $2)`, [
      item.guid ?? item.link ?? uuidv4(),
      item,
    ]);
    const rec = normalize({
      ...item,
      source: "rss",
      source_id: item.guid ?? item.link ?? uuidv4(),
    });
    await query(
      `INSERT INTO records (source, source_id, title, description, published_at, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (source, source_id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, published_at=EXCLUDED.published_at, metadata=records.metadata || EXCLUDED.metadata`,
      [
        rec.source,
        rec.source_id,
        rec.title,
        rec.description,
        rec.published_at ? new Date(rec.published_at) : null,
        rec.metadata,
      ]
    );
    processed++;
  }
  return processed;
}
