// src/etl/csvSource.ts
import fs from "fs";
import { parse } from "csv-parse";
import { query } from "../db";
import { normalize } from "../schemas/record";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export async function readCsv(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const items: any[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on("data", (row) => items.push(row))
      .on("end", () => resolve(items))
      .on("error", reject);
  });
}

export async function ingestCsvFile(filePath: string) {
  const items = await readCsv(filePath);
  let processed = 0;
  for (const row of items) {
    await query(`INSERT INTO raw_csv (source_id, payload) VALUES ($1, $2)`, [
      row.id ?? uuidv4(),
      row,
    ]);
    const rec = normalize({ ...row, source: "csv", id: row.id ?? uuidv4() });
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
