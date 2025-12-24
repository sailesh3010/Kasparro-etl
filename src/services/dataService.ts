// src/services/dataService.ts
import { query } from "../db";

export async function getData({
  page = 1,
  limit = 20,
  q,
}: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  const offset = (page - 1) * limit;
  const values: any[] = [limit, offset];
  let base = `SELECT id, source, source_id, title, description, published_at, metadata FROM records`;
  if (q) {
    base += ` WHERE title ILIKE $3 OR description ILIKE $3`;
    values.push(`%${q}%`);
  }
  base += ` ORDER BY coalesce(published_at, now()) DESC LIMIT $1 OFFSET $2`;
  const res = await query(base, values);
  const countRes = await query(
    `SELECT COUNT(*) FROM records ${
      q ? `WHERE title ILIKE $1 OR description ILIKE $1` : ""
    }`,
    q ? [`%${q}%`] : []
  );
  const total = parseInt(countRes.rows[0].count, 10);
  return {
    data: res.rows,
    meta: {
      page,
      limit,
      total,
      request_id: require("uuid").v4(),
    },
  };
}
